import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from './entities/work-schedule.entity';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { FilterWorkSchedulesDto } from './dto/filter-work-schedules.dto';
import { WorkStatus } from './enums/work-status.enum';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly repo: Repository<WorkSchedule>,
  ) {}

  async create(dto: CreateWorkScheduleDto): Promise<WorkSchedule> {
    // Un operario solo puede tener un estado por día (unique constraint)
    const existing = await this.repo.findOne({
      where: { userId: dto.userId, workDate: dto.workDate },
    });

    if (existing) {
      throw new ConflictException(
        `El operario ya tiene un registro para la fecha ${dto.workDate}`,
      );
    }

    const schedule = this.repo.create(dto);
    return this.repo.save(schedule);
  }

  async findAll(filter: FilterWorkSchedulesDto): Promise<WorkSchedule[]> {
    const qb = this.repo
      .createQueryBuilder('ws')
      .leftJoinAndSelect('ws.user', 'user')
      .leftJoinAndSelect('ws.replacedByUser', 'replacedByUser')
      .leftJoinAndSelect('ws.municipality', 'municipality');

    if (filter.userId) {
      qb.andWhere('ws.userId = :userId', { userId: filter.userId });
    }

    if (filter.workDate) {
      qb.andWhere('ws.workDate = :workDate', { workDate: filter.workDate });
    }

    if (filter.dateFrom) {
      qb.andWhere('ws.workDate >= :dateFrom', { dateFrom: filter.dateFrom });
    }

    if (filter.dateTo) {
      qb.andWhere('ws.workDate <= :dateTo', { dateTo: filter.dateTo });
    }

    if (filter.status) {
      qb.andWhere('ws.status = :status', { status: filter.status });
    }

    if (filter.municipalityId) {
      qb.andWhere('ws.municipalityId = :municipalityId', {
        municipalityId: filter.municipalityId,
      });
    }

    qb.andWhere('ws.isArchived = false').orderBy('ws.workDate', 'DESC');

    return qb.getMany();
  }

  // Obtener todos los retenes disponibles para una fecha dada
  async findAvailableRetenes(date: string, municipalityId: string): Promise<WorkSchedule[]> {
    return this.repo
      .createQueryBuilder('ws')
      .leftJoinAndSelect('ws.user', 'user')
      .leftJoinAndSelect('user.operatorProfile', 'operatorProfile')
      .where('ws.workDate = :date', { date })
      .andWhere('ws.status = :status', { status: WorkStatus.RETEN })
      .andWhere('ws.municipalityId = :municipalityId', { municipalityId })
      .andWhere('ws.isArchived = false')
      .orderBy('user.lastName', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<WorkSchedule> {
    const schedule = await this.repo.findOne({
      where: { id },
      relations: ['user', 'replacedByUser', 'municipality'],
    });
    if (!schedule) throw new NotFoundException('Registro de horario no encontrado');
    return schedule;
  }

  async update(id: string, dto: UpdateWorkScheduleDto): Promise<WorkSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.repo.save(schedule);
  }

  async remove(id: string) {
    const schedule = await this.findOne(id);
    schedule.isArchived = true;
    schedule.archivedAt = new Date();
    await this.repo.save(schedule);
    return { statusCode: 200, message: 'Registro archivado exitosamente' };
  }
}
