import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyCrewAssignment } from './entities/daily-crew-assignment.entity';
import { CreateDailyCrewAssignmentDto } from './dto/create-daily-crew-assignment.dto';
import { UpdateDailyCrewAssignmentDto } from './dto/update-daily-crew-assignment.dto';
import { FilterDailyCrewAssignmentsDto } from './dto/filter-daily-crew-assignments.dto';
import { PersonnelRole } from 'src/users/enums/personnel-role.enum';

@Injectable()
export class DailyCrewAssignmentsService {
  constructor(
    @InjectRepository(DailyCrewAssignment)
    private repo: Repository<DailyCrewAssignment>,
  ) {}

  async create(dto: CreateDailyCrewAssignmentDto) {
    //Verificar que no exista una asignación con la misma fecha y el mismo usuario
    if(dto.date && dto.userId){
      const existingAssignment = await this.repo.findOne({
        where: { date: dto.date, userId: dto.userId },
      });
      if (existingAssignment) throw new ConflictException('Ya existe una asignación para este usuario en la fecha indicada');
    }

    //Verificar que no exista una asignación con la misma fecha para el mismo camión y el rol de DRIVER
    if(dto.date && dto.truckId && dto.personnelRole === PersonnelRole.DRIVER){
      const existingAssignment = await this.repo.findOne({
        where: { date: dto.date, truckId: dto.truckId, personnelRole: PersonnelRole.DRIVER },
      });
      if (existingAssignment) throw new ConflictException('Ya existe una asignación de conductor para este camión en la fecha indicada');
    }
    
    const assignment = this.repo.create(dto);
    return await this.repo.save(assignment);
  }

  async findAll(filter: FilterDailyCrewAssignmentsDto) {
    const {date, personnelRole} = filter;

    const queryBuilder = this.repo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.truck', 'truck')
      .leftJoinAndSelect('assignment.user', 'user');

    if (date) {
      queryBuilder.andWhere('assignment.date = :date', { date });
    }

    if (personnelRole) {
      queryBuilder.andWhere('assignment.personnelRole = :personnelRole', { personnelRole });
    }

    queryBuilder.orderBy('assignment.date', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string) {
    const assignment = await this.repo.findOne({
      where: { id },
      relations: ['truck', 'user'],
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    return assignment;
  }

  async update(id: string, dto: UpdateDailyCrewAssignmentDto) {
    const assignment = await this.findOne(id);
    Object.assign(assignment, dto);
    return this.repo.save(assignment);
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);
    await this.repo.remove(assignment);
    
    return { statusCode: 200, message: 'Asignación eliminada exitosamente' };
  }
}
