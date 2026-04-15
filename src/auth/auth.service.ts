import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { User } from '../users/entities/user.entity';
import { Address } from '../users/entities/address.entity';
import { NeighborsService } from '../users/services/neighbors.service';
import { CreateNeighborDto } from '../users/dto/neighbors/create-neighbor.dto';
import { UserType } from 'src/user-type/enums/user-type.enum';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

// Duración del token en segundos (1 hora = 3600s)
const TOKEN_TTL_SECONDS = 3600;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
    @InjectRepository(OperatorProfile)
    private operatorRepo: Repository<OperatorProfile>,
    private neighborsService: NeighborsService,
    private jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async registerNeighbor(dto: CreateNeighborDto) {
    // 1. Crear el vecino usando el servicio existente (valida duplicados, crea address, etc.)
    await this.neighborsService.create(dto);

    // 2. Cargar el usuario recién creado con su municipalidad para buildToken
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'lastName', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
      relations: ['municipality'],
    });

    if (!user) throw new NotFoundException('Error al recuperar el usuario registrado');

    // 3. Devolver token igual que en login
    return this.buildToken(user, UserType.NEIGHBOR);
  }

  async loginNeighbor(email: string, password: string, fcmToken?: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'lastName', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
      relations: ['municipality'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user.userType !== UserType.NEIGHBOR) throw new ForbiddenException('Acceso no permitido');
    if (!user.isActive || user.isArchived) throw new ForbiddenException('Usuario inactivo');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

    if (fcmToken) {
      await this.usersRepo.update(user.id, { fcmToken });
    }

    const address = await this.addressRepo.findOne({
      where: { userId: user.id },
      select: ['zoneId', 'notifyBefore', 'activateNotification', 'street'],
    });

    return this.buildToken(user, UserType.NEIGHBOR, {
      zoneId:               address?.zoneId               ?? null,
      notifyBefore:         address?.notifyBefore         ?? 5,
      activateNotification: address?.activateNotification ?? true,
      street:               address?.street               ?? null,
    });
  }

  async loginAdmin(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId', 'adminRole'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user.userType !== UserType.ADMIN) throw new ForbiddenException('No es administrador');
    if (!user.isActive || user.isArchived) throw new ForbiddenException('Usuario inactivo');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    return this.buildToken(user, UserType.ADMIN, {
      adminRole: user.adminRole ?? 'ADMIN',
    });
  }

  async loginOperator(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
      relations: ['operatorProfile'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user.userType !== UserType.OPERATOR) throw new ForbiddenException('No es operador');
    if (!user.operatorProfile || !user.operatorProfile.isActive) {
      throw new ForbiddenException('Operador no habilitado');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    return this.buildToken(user, UserType.OPERATOR, {
      truckId: user.operatorProfile.assignedTruckId,
      roleId: user.operatorProfile.personnelRole,
    });
  }

  /**
   * SEC-04: Logout real — invalida el token en la blacklist de Redis.
   *
   * El cliente debe enviar el JWT en el header Authorization para que
   * podamos extraer el jti y agregarlo a la blacklist.
   * También limpia el fcmToken para dejar de enviar notificaciones push.
   *
   * @param userId  ID del usuario que cierra sesión
   * @param jti     JWT ID único del token activo (extraído del payload)
   */
  async logout(userId: string, jti?: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Limpiar FCM token para dejar de enviar notificaciones push
    await this.usersRepo.update(userId, { fcmToken: null });

    // Agregar el jti a la blacklist con TTL igual al tiempo de expiración del token
    if (jti) {
      await this.redis.set(
        `jwt_blacklist:${jti}`,
        '1',
        'EX',
        TOKEN_TTL_SECONDS,
      );
    }

    return {
      statusCode: 200,
      message: 'Sesión cerrada exitosamente. El token ha sido invalidado.',
    };
  }

  private buildToken(user: User, role: string, extra: any = {}) {
    // SEC-04: incluir jti (JWT ID) único en cada token para poder revocarlo
    const jti = crypto.randomBytes(16).toString('hex');

    const payload = {
      sub: user.id,
      email: user.email,
      role,
      jti,           // Identificador único del token — usado para blacklist en logout
      ...extra,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName ?? null,
        fullName: [user.name, user.lastName].filter(Boolean).join(' '),
        email: user.email,
        municipalityId: user.municipalityId,
        municipalityName: user.municipality ? user.municipality.officialName : null,
        municipalityDistrictId: user.municipality ? user.municipality.districtId : null,
        role,
        zoneId:               extra.zoneId               ?? null,
        notifyBefore:         extra.notifyBefore         ?? null,
        activateNotification: extra.activateNotification ?? null,
        street:               extra.street               ?? null,
        adminRole:            extra.adminRole            ?? null,
      },
    };
  }
}
