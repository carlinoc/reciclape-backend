import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DailyCrewAssignment, Shift } from './entities/daily-crew-assignment.entity';
import { CreateDailyCrewAssignmentDto } from './dto/create-daily-crew-assignment.dto';
import { UpdateDailyCrewAssignmentDto } from './dto/update-daily-crew-assignment.dto';
import { FilterDailyCrewAssignmentsDto, DateRangeMode } from './dto/filter-daily-crew-assignments.dto';
import { PersonnelRole } from 'src/users/enums/personnel-role.enum';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

// ─── Helpers de fecha ────────────────────────────────────────────────────────

function localDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Dom … 6=Sáb
}

function weekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() + (day === 0 ? -6 : 1 - day));
  return dt.toISOString().slice(0, 10);
}

function weekEnd(dateStr: string): string {
  const start = weekStart(dateStr);
  const [y, m, d] = start.split('-').map(Number);
  return new Date(y, m - 1, d + 6).toISOString().slice(0, 10);
}

function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + '-01';
}

function monthEnd(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const SHIFT_LABELS: Record<Shift, string> = {
  [Shift.MORNING]:   'Mañana',
  [Shift.AFTERNOON]: 'Tarde',
  [Shift.NIGHT]:     'Noche',
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DailyCrewAssignmentsService {
  constructor(
    @InjectRepository(DailyCrewAssignment)
    private repo: Repository<DailyCrewAssignment>,
    private dataSource: DataSource,
  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(dto: CreateDailyCrewAssignmentDto) {
    const { date, shift, truckId, userId, personnelRole } = dto;
    const isSunday = localDayOfWeek(date) === 0;

    // 1. Un operador no puede estar asignado dos veces en el mismo turno-día
    const alreadyAssigned = await this.repo.findOne({
      where: { date, shift, userId },
    });
    if (alreadyAssigned) {
      throw new ConflictException(
        `Este operador ya tiene una asignación en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
      );
    }

    // 2. Validaciones por rol dentro del mismo turno-día-camión
    if (personnelRole === PersonnelRole.DRIVER) {
      // Solo 1 conductor por turno por camión
      const driverExists = await this.repo.findOne({
        where: { date, shift, truckId, personnelRole: PersonnelRole.DRIVER },
      });
      if (driverExists) {
        throw new ConflictException(
          `El camión ya tiene un conductor asignado en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
        );
      }

      // Lun–Sáb: solo el conductor titular
      if (!isSunday) {
        const profile = await this.dataSource.getRepository(OperatorProfile).findOne({
          where: { assignedTruckId: truckId, personnelRole: PersonnelRole.DRIVER },
        });
        if (profile && profile.userId !== userId) {
          throw new ConflictException(
            `En turno ${SHIFT_LABELS[shift]} de Lun–Sáb solo el conductor titular puede manejar este camión. ` +
            `Los domingos y feriados se permite asignar un conductor de reemplazo.`,
          );
        }
      }
    }

    if (personnelRole === PersonnelRole.ASSISTANT) {
      // Máximo 3 ayudantes por turno por camión
      const count = await this.repo.count({
        where: { date, shift, truckId, personnelRole: PersonnelRole.ASSISTANT },
      });
      if (count >= 3) {
        throw new ConflictException(
          `El camión ya tiene el máximo de 3 ayudantes en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
        );
      }
    }

    if (personnelRole === PersonnelRole.PROMOTER) {
      const exists = await this.repo.findOne({
        where: { date, shift, truckId, personnelRole: PersonnelRole.PROMOTER },
      });
      if (exists) {
        throw new ConflictException(
          `El camión ya tiene un promotor en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
        );
      }
    }

    if (personnelRole === PersonnelRole.MANAGER) {
      const exists = await this.repo.findOne({
        where: { date, shift, truckId, personnelRole: PersonnelRole.MANAGER },
      });
      if (exists) {
        throw new ConflictException(
          `El camión ya tiene un gestor en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
        );
      }
    }

    try {
      return await this.repo.save(this.repo.create(dto));
    } catch (error) {
      // Código 23505 = unique_violation en PostgreSQL
      // Por si alguna validación previa no alcanzó a cubrir el caso (race condition)
      if (error?.code === '23505') {
        const detail: string = error?.detail ?? '';
        if (detail.includes('userId')) {
          throw new ConflictException(
            `El operador ya tiene una asignación en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
          );
        }
        throw new ConflictException(
          `Ya existe una asignación con los mismos datos en el turno ${SHIFT_LABELS[shift]} del ${date}.`,
        );
      }
      // Código 23503 = foreign_key_violation (truckId, userId o municipalityId no existen)
      if (error?.code === '23503') {
        const detail: string = error?.detail ?? '';
        if (detail.includes('truckId'))        throw new ConflictException('El camión indicado no existe.');
        if (detail.includes('userId'))          throw new ConflictException('El operador indicado no existe.');
        if (detail.includes('municipalityId'))  throw new ConflictException('La municipalidad indicada no existe.');
        throw new ConflictException('Una referencia enviada no existe en la base de datos.');
      }
      // Cualquier otro error de BD → mensaje genérico legible
      throw new InternalServerErrorException(
        'Error al guardar la asignación. Verifica los datos e intenta de nuevo.',
      );
    }
  }

  // ── FIND ALL ────────────────────────────────────────────────────────────────

  async findAll(filter: FilterDailyCrewAssignmentsDto) {
    const { date, mode = DateRangeMode.DAY, shift, municipalityId, truckId, userId, personnelRole } = filter;

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.truck', 'truck')
      .leftJoinAndSelect('a.user', 'user');

    // Rango de fechas
    if (date) {
      if (mode === DateRangeMode.DAY) {
        qb.andWhere('a.date = :date', { date });
      } else if (mode === DateRangeMode.WEEK) {
        qb.andWhere('a.date BETWEEN :from AND :to', { from: weekStart(date), to: weekEnd(date) });
      } else if (mode === DateRangeMode.MONTH) {
        qb.andWhere('a.date BETWEEN :from AND :to', { from: monthStart(date), to: monthEnd(date) });
      }
    }

    if (shift)          qb.andWhere('a.shift = :shift',                   { shift });
    if (municipalityId) qb.andWhere('a.municipalityId = :municipalityId', { municipalityId });
    if (truckId)        qb.andWhere('a.truckId = :truckId',               { truckId });
    if (userId)         qb.andWhere('a.userId = :userId',                 { userId });
    if (personnelRole)  qb.andWhere('a.personnelRole = :personnelRole',   { personnelRole });

    qb.orderBy('a.date', 'ASC')
      .addOrderBy('a.shift', 'ASC')
      .addOrderBy('truck.licensePlate', 'ASC');

    const assignments = await qb.getMany();

    // Modo semana o mes → agrupar por fecha y turno
    if (date && mode !== DateRangeMode.DAY) {
      return this.groupByDateAndShift(assignments, mode, date);
    }

    return assignments;
  }

  // ── Agrupar por fecha → turno (vista calendario) ───────────────────────────

  private groupByDateAndShift(
    assignments: DailyCrewAssignment[],
    mode: DateRangeMode,
    referenceDate: string,
  ) {
    const from = mode === DateRangeMode.WEEK ? weekStart(referenceDate) : monthStart(referenceDate);
    const to   = mode === DateRangeMode.WEEK ? weekEnd(referenceDate)   : monthEnd(referenceDate);

    const dates: string[] = [];
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    const cursor = new Date(fy, fm - 1, fd);
    const end    = new Date(ty, tm - 1, td);
    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Indexar por "date|shift"
    const index = new Map<string, DailyCrewAssignment[]>();
    for (const a of assignments) {
      const key = `${a.date}|${a.shift}`;
      if (!index.has(key)) index.set(key, []);
      index.get(key)!.push(a);
    }

    return dates.map((d) => ({
      date:      d,
      dayOfWeek: DAY_NAMES[localDayOfWeek(d)],
      shifts: [Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT].map((s) => ({
        shift:       s,
        shiftLabel:  SHIFT_LABELS[s],
        assignments: index.get(`${d}|${s}`) ?? [],
        total:       index.get(`${d}|${s}`)?.length ?? 0,
      })),
    }));
  }

  // ── FIND ONE ────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const a = await this.repo.findOne({ where: { id }, relations: ['truck', 'user'] });
    if (!a) throw new NotFoundException('Asignación no encontrada');
    return a;
  }

  // ── UPDATE (solo notes) ─────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDailyCrewAssignmentDto) {
    const assignment = await this.findOne(id);
    if (dto.notes !== undefined) assignment.notes = dto.notes;
    return this.repo.save(assignment);
  }

  // ── REMOVE ──────────────────────────────────────────────────────────────────

  async remove(id: string) {
    await this.repo.remove(await this.findOne(id));
    return { statusCode: 200, message: 'Asignación eliminada exitosamente' };
  }

  // ── SUGGEST ─────────────────────────────────────────────────────────────────

  async suggest(truckId: string, date: string, shift: Shift) {
    const isSunday = localDayOfWeek(date) === 0;

    const profiles = await this.dataSource
      .getRepository(OperatorProfile)
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'user')
      .where('p.assignedTruckId = :truckId', { truckId })
      .andWhere('p.isActive = true')
      .andWhere('user.isArchived = false')
      .getMany();

    const existing = await this.repo.find({ where: { date, shift, truckId } });
    const assignedIds = new Set(existing.map((a) => a.userId));

    const suggested = profiles
      .filter((p) => !assignedIds.has(p.userId))
      .map((p) => ({
        userId:        p.userId,
        personnelRole: p.personnelRole,
        name:          `${p.user.name} ${p.user.lastName}`,
        isTitular:     true,
        note: p.personnelRole === PersonnelRole.DRIVER && isSunday
          ? 'Domingo — puede asignarse un conductor de reemplazo'
          : p.personnelRole === PersonnelRole.ASSISTANT
          ? 'Ayudante rota — confirmar disponibilidad para este turno'
          : undefined,
      }));

    return {
      date,
      shift,
      shiftLabel: SHIFT_LABELS[shift],
      isSunday,
      alreadyAssigned: existing.length,
      suggested,
    };
  }
}
