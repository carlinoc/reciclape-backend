import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Truck } from 'src/trucks/entities/truck.entity';
import { TruckPosition } from 'src/truck-positions/entities/truck-position.entity';
import { RouteSchedule } from 'src/route-schedules/entities/route-schedule.entity';
import { DailyCrewAssignment } from 'src/daily-crew-assignments/entities/daily-crew-assignment.entity';

// ── CONSTANTES DE ESTADO ────────────────────────────────────────────────────
// MOVING:  recibió señal GPS en los últimos N minutos y speed > umbral
// STOPPED: recibió señal GPS reciente pero speed ~ 0 (detenido/en espera)
// OFFLINE: última señal GPS fue hace más de OFFLINE_MINUTES minutos
// NO_GPS:  nunca ha enviado posición GPS hoy
const OFFLINE_MINUTES  = 5;    // sin señal > 5 min = OFFLINE
const MOVING_KMH       = 3;    // speed >= 3 km/h = MOVING

type TruckStatus = 'MOVING' | 'STOPPED' | 'OFFLINE' | 'NO_GPS';

function calcStatus(lastTimestamp: Date | null, speedKmh: number | null): TruckStatus {
  if (!lastTimestamp) return 'NO_GPS';
  const minutesAgo = (Date.now() - lastTimestamp.getTime()) / 60000;
  if (minutesAgo > OFFLINE_MINUTES) return 'OFFLINE';
  return (speedKmh ?? 0) >= MOVING_KMH ? 'MOVING' : 'STOPPED';
}

function statusLabel(s: TruckStatus): string {
  return { MOVING:'En movimiento', STOPPED:'Detenido', OFFLINE:'Sin señal', NO_GPS:'Sin GPS hoy' }[s];
}

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(TruckPosition)
    private readonly positionRepo: Repository<TruckPosition>,
    @InjectRepository(RouteSchedule)
    private readonly scheduleRepo: Repository<RouteSchedule>,
    @InjectRepository(DailyCrewAssignment)
    private readonly crewRepo: Repository<DailyCrewAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboard(municipalityId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Todos los camiones activos de la municipalidad
    const trucks = await this.truckRepo.find({
      where: { municipalityId, isArchived: false },
      relations: ['truckType', 'operatorProfiles', 'operatorProfiles.user'],
    });

    if (!trucks.length) {
      return { municipalityId, total: 0, summary: this.emptySummary(), units: [] };
    }

    const truckIds = trucks.map(t => t.id);

    // 2. Última posición GPS de hoy para cada camión — una sola query
    const lastPositions: { truckId: string; lat: number; lng: number; speed: number; heading: number; accuracy: number; timestamp: Date }[] = 
      await this.dataSource.query(`
        SELECT DISTINCT ON (tp."truckId")
          tp."truckId",
          ST_Y(tp.location::geometry)  AS lat,
          ST_X(tp.location::geometry)  AS lng,
          tp.speed,
          tp.heading,
          tp.accuracy,
          tp.timestamp
        FROM "truckPositions" tp
        WHERE tp."truckId" = ANY($1)
          AND tp.timestamp >= $2
        ORDER BY tp."truckId", tp.timestamp DESC
      `, [truckIds, startOfToday]);

    const posMap = new Map(lastPositions.map(p => [p.truckId, p]));

    // 3. Zonas de todos los routeSchedules activos del camión
    const schedules = await this.scheduleRepo
      .createQueryBuilder('rs')
      .leftJoinAndSelect('rs.zone', 'zone')
      .where('rs.truckId IN (:...truckIds)', { truckIds })
      .andWhere('rs.isArchived = false')
      .andWhere('rs.isActive = true')
      .getMany();

    // 3b. Conductor asignado HOY por dailyCrewAssignment (tiene prioridad sobre operatorProfiles)
    const todayStr = startOfToday.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const todayCrews = await this.crewRepo
      .createQueryBuilder('dc')
      .leftJoinAndSelect('dc.user', 'user')
      .where('dc.truckId IN (:...truckIds)', { truckIds })
      .andWhere('dc.date = :today', { today: todayStr })
      .andWhere("dc.personnelRole = 'DRIVER'")
      .getMany();

    // Map: truckId -> conductor del día
    const dailyDriverMap = new Map<string, { userId: string; name: string }>();
    for (const dc of todayCrews) {
      if (!dailyDriverMap.has(dc.truckId) && dc.user) {
        dailyDriverMap.set(dc.truckId, {
          userId: dc.userId,
          name: `${dc.user.name ?? ''} ${dc.user.lastName ?? ''}`.trim(),
        });
      }
    }

    const zonesMap = new Map<string, { id: string; name: string; color: string }[]>();
    for (const rs of schedules) {
      if (!rs.zone) continue;
      const list = zonesMap.get(rs.truckId) ?? [];
      if (!list.find(z => z.id === rs.zone.id)) {
        list.push({ id: rs.zone.id, name: rs.zone.name, color: rs.zone.color });
      }
      zonesMap.set(rs.truckId, list);
    }

    // 4. Construir unidades con estado calculado
    const units = trucks.map(truck => {
      const pos    = posMap.get(truck.id) ?? null;
      const speed  = pos ? parseFloat(String(pos.speed ?? 0)) : null;
      const ts     = pos ? new Date(pos.timestamp) : null;
      const status: TruckStatus = calcStatus(ts, speed);

      // Conductor: primero daily assignment de hoy, luego perfil permanente
      const dailyDriver = dailyDriverMap.get(truck.id) ?? null;
      const profileDriver = truck.operatorProfiles?.find(op => op.personnelRole === 'DRIVER');

      return {
        id:                truck.id,
        licensePlate:      truck.licensePlate,
        truckType:         truck.truckType?.type ?? null,
        registrationStatus:truck.registrationStatus,
        isActive:          truck.isActive,
        zones:             zonesMap.get(truck.id) ?? [],

        driver: dailyDriver
          ? { userId: dailyDriver.userId, name: dailyDriver.name, source: 'daily' }
          : profileDriver
            ? { userId: profileDriver.userId, name: profileDriver.user ? `${profileDriver.user.name ?? ''} ${profileDriver.user.lastName ?? ''}`.trim() : null, source: 'profile' }
            : null,

        // Estado GPS
        status,
        statusLabel: statusLabel(status),

        // Posición GPS actual (null si NO_GPS)
        gps: pos ? {
          latitude:       parseFloat(String(pos.lat)),
          longitude:      parseFloat(String(pos.lng)),
          speed:          speed,
          heading:        pos.heading ? parseFloat(String(pos.heading)) : null,
          accuracy:       pos.accuracy ? parseFloat(String(pos.accuracy)) : null,
          timestamp:      ts?.toISOString() ?? null,
          timestampLocal: ts?.toLocaleString('es-PE', { timeZone: 'America/Lima' }) ?? null,
          minutesAgo:     ts ? Math.round((Date.now() - ts.getTime()) / 60000) : null,
        } : null,
      };
    });

    // 5. Resumen por estado
    const summary = {
      total:   units.length,
      moving:  units.filter(u => u.status === 'MOVING').length,
      stopped: units.filter(u => u.status === 'STOPPED').length,
      offline: units.filter(u => u.status === 'OFFLINE').length,
      noGps:   units.filter(u => u.status === 'NO_GPS').length,
    };

    return {
      municipalityId,
      generatedAt: now.toISOString(),
      generatedAtLocal: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      summary,
      units: units.sort((a, b) => {
        // Ordenar: MOVING primero, luego STOPPED, OFFLINE, NO_GPS
        const order = { MOVING:0, STOPPED:1, OFFLINE:2, NO_GPS:3 };
        return order[a.status] - order[b.status];
      }),
    };
  }

  private emptySummary() {
    return { total:0, moving:0, stopped:0, offline:0, noGps:0 };
  }
}
