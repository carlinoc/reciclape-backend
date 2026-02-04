import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UserType } from 'src/user-type/enums/user-type.enum';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(OperatorProfile)
    private operatorRepo: Repository<OperatorProfile>,
    private jwtService: JwtService,
  ) {}

  async loginNeighbor(email: string, password: string, fcmToken?: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.userType !== UserType.NEIGHBOR) {
      throw new ForbiddenException('Acceso no permitido');
    }

    if (!user.isActive || user.isArchived) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar el FCM token si se proporciona
    if (fcmToken) {
      await this.usersRepo.update(user.id, { fcmToken: fcmToken });
    }
    
    return this.buildToken(user, UserType.NEIGHBOR);
  }

  async logout(userId: string) {
    // Buscamos si el usuario existe antes de actualizar
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Seteamos el fcmToken a null 
    await this.usersRepo.update(userId, { fcmToken: null });

    return { 
      statusCode: 200, 
      message: 'Sesión cerrada exitosamente y token de notificaciones eliminado' 
    };
  }

   async loginAdmin(email: string, password: string) {
    const user = await this.usersRepo.findOne({ 
        where: { email },
        select: ['id', 'name', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.userType !== UserType.ADMIN) {
      throw new ForbiddenException('No es administrador');
    }

    if (!user.isActive || user.isArchived) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    return this.buildToken(user, UserType.ADMIN);
  }

  async loginOperator(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'userType', 'isActive', 'isArchived', 'municipalityId'],
      relations: ['operatorProfile'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.userType !== UserType.OPERATOR) {
      throw new ForbiddenException('No es operador');
    }

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

  private buildToken(user: User, role: string, extra: any = {}) {
    const payload = {
      sub: user.id,
      email: user.email,
      role,
      ...extra,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        municipalityId: user.municipalityId,
        role,
      },
    };
  }
}
