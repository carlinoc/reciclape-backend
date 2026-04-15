import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Zone } from 'src/zones/entities/zones.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

/**
 * Servicio de zonas.
 * Maneja creación, lectura, actualización y eliminación de zonas.
 */
@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Crea una nueva zona.
   * @param dto - Datos de la zona a crear
   * @returns Zona creada
   */
  async create(dto: CreateZoneDto) {
    //Verificar que no exista una zona con el mismo nombre
    if(dto.name){
      const existingZone = await this.zoneRepo.findOne({
        where: { name: dto.name },
      });
      if (existingZone) throw new ConflictException('Ya existe una zona con el mismo nombre');
    }

    const zone = this.zoneRepo.create(dto);
    return this.zoneRepo.save(zone);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por province
    const queryBuilder = this.zoneRepo
      .createQueryBuilder('zone')
      .leftJoinAndSelect('zone.municipality', 'municipality')
      .where('municipality.id = :municipalityId', { municipalityId });

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('zone.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('zone.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('zone.isArchived = false'); 
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('zone.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene todas las zonas con filtros opcionales.
   * @param isActive - Filtrar por estado activo (opcional)
   * @returns Lista de zonas filtradas
   */
  // ── DETECTAR ZONA POR COORDENADAS ─────────────────────────────────────────
  // Estrategia: zona cuyo centroide sea el más cercano al punto del vecino.
  // Usa distancia euclidiana en grados — suficiente para zonas de un mismo distrito.
  // Si en el futuro se agregan polígonos PostGIS, este método se puede reemplazar
  // por ST_Contains() sin cambiar el contrato del endpoint.
  async detectZoneByCoords(
    latitude: number,
    longitude: number,
    municipalityId: string,
  ): Promise<{
    zone: { id: string; name: string; color: string | null; centerLatitude: number; centerLongitude: number } | null;
    distanceKm: number | null;
    message: string;
  }> {
    // Una query: ordena por distancia euclidiana al punto del vecino y toma la más cercana
    const results = await this.dataSource.query(
      `SELECT
         id,
         name,
         color,
         "centerLatitude",
         "centerLongitude",
         SQRT(
           POWER("centerLatitude"  - $1, 2) +
           POWER("centerLongitude" - $2, 2)
         ) AS dist_deg
       FROM zones
       WHERE "municipalityId" = $3
         AND "isArchived" = false
         AND "isActive"   = true
         AND "centerLatitude"  IS NOT NULL
         AND "centerLongitude" IS NOT NULL
       ORDER BY dist_deg ASC
       LIMIT 1`,
      [latitude, longitude, municipalityId],
    );

    if (!results || results.length === 0) {
      return {
        zone: null,
        distanceKm: null,
        message:
          'No se encontraron zonas con centroide configurado para esta municipalidad. ' +
          'El administrador debe configurar centerLatitude y centerLongitude en cada zona.',
      };
    }

    const r = results[0];

    // Convertir distancia en grados a km aproximado (1° ≈ 111 km)
    const distanceKm = parseFloat((parseFloat(r.dist_deg) * 111).toFixed(3));

    return {
      zone: {
        id:              r.id,
        name:            r.name,
        color:           r.color,
        centerLatitude:  parseFloat(r.centerLatitude),
        centerLongitude: parseFloat(r.centerLongitude),
      },
      distanceKm,
      message: `Zona detectada: ${r.name} (a ~${distanceKm} km del punto indicado)`,
    };
  }

  // ── ZONAS + RUTAS + ÁREAS en una sola llamada ────────────────────────────
  // Reemplaza el patrón N+1: 1 llamada por zona → 1 sola llamada para todo
  async findWithSchedules(municipalityId: string): Promise<any[]> {
    if (!municipalityId) throw new BadRequestException('municipalityId es requerido');

    // 1. Zonas de la municipalidad
    const zones = await this.zoneRepo
      .createQueryBuilder('zone')
      .select(['zone.id', 'zone.name', 'zone.color', 'zone.centerLatitude', 'zone.centerLongitude', 'zone.isActive'])
      .where('zone.municipalityId = :municipalityId', { municipalityId })
      .andWhere('zone.isArchived = false')
      .orderBy('zone.name', 'ASC')
      .getMany();

    if (!zones.length) return [];

    const zoneIds = zones.map(z => z.id);

    // 2. Rutas con camión — una sola query para todas las zonas
    const schedules = await this.dataSource.query(`
      SELECT
        rs.id,
        rs."zoneId",
        rs."truckId",
        rs."daysOfWeek",
        rs.shift,
        rs."turnNumber",
        rs."isActive",
        rs."isMainRoad",
        t."licensePlate"
      FROM "routeSchedules" rs
      LEFT JOIN trucks t ON t.id = rs."truckId"
      WHERE rs."zoneId" = ANY($1)
        AND rs."isArchived" = false
        AND rs."isActive"   = true
      ORDER BY rs."zoneId", rs."daysOfWeek"
    `, [zoneIds]);

    if (!schedules.length) {
      return zones.map(z => ({ ...z, schedules: [] }));
    }

    const scheduleIds = schedules.map((s: any) => s.id);

    // 3. Áreas de recolección — una sola query para todas las rutas
    const areas = await this.dataSource.query(`
      SELECT
        ca.id,
        ca.name,
        ca."routeScheduleId",
        cat.name AS "areaTypeName",
        cat.id   AS "areaTypeId"
      FROM "collectionAreas" ca
      LEFT JOIN "collectionAreaTypes" cat ON cat.id = ca."areaTypeId"
      WHERE ca."routeScheduleId" = ANY($1)
      ORDER BY ca.name
    `, [scheduleIds]);

    // 4. Agrupar áreas por routeScheduleId
    const areasBySchedule = new Map<string, any[]>();
    for (const a of areas) {
      const list = areasBySchedule.get(a.routeScheduleId) ?? [];
      list.push({ id: a.id, name: a.name, areaTypeId: a.areaTypeId, areaTypeName: a.areaTypeName });
      areasBySchedule.set(a.routeScheduleId, list);
    }

    // 5. Agrupar rutas por zoneId
    const schedulesByZone = new Map<string, any[]>();
    for (const s of schedules) {
      const list = schedulesByZone.get(s.zoneId) ?? [];
      list.push({
        id:          s.id,
        truckId:     s.truckId,
        licensePlate:s.licensePlate,
        daysOfWeek:  s.daysOfWeek,
        shift:       s.shift,
        turnNumber:  s.turnNumber,
        isMainRoad:  s.isMainRoad,
        areas:       areasBySchedule.get(s.id) ?? [],
      });
      schedulesByZone.set(s.zoneId, list);
    }

    // 6. Ensamblar resultado final
    return zones.map(z => ({
      id:              z.id,
      name:            z.name,
      color:           z.color,
      centerLatitude:  z.centerLatitude,
      centerLongitude: z.centerLongitude,
      isActive:        z.isActive,
      schedules:       schedulesByZone.get(z.id) ?? [],
    }));
  }

  async findSimpleByMunicipality(
    municipalityId: string,
    isActive?: boolean,
  ): Promise<{ id: string; name: string; color: string | null; centerLatitude: number | null; centerLongitude: number | null }[]> {
    const active = isActive !== undefined ? isActive : true;

    // Usar QueryBuilder con select explícito para evitar el eager load de municipality
    const rows = await this.zoneRepo
      .createQueryBuilder('zone')
      .select([
        'zone.id',
        'zone.name',
        'zone.color',
        'zone.centerLatitude',
        'zone.centerLongitude',
      ])
      .where('zone.municipalityId = :municipalityId', { municipalityId })
      .andWhere('zone.isArchived = false')
      .andWhere('zone.isActive = :active', { active })
      .orderBy('zone.name', 'ASC')
      .getMany();

    return rows;
  }

  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.zoneRepo.createQueryBuilder('zone');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('zone.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('zone.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('zone.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('zone.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene una zona por su ID.
   * @param id - ID de la zona
   * @throws NotFoundException si no existe
   * @returns Zona encontrada
   */
  async findOne(id: string) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    return zone;
  }

  /**
   * Actualiza una zona existente.
   * @param id - ID de la zona a actualizar
   * @param dto - Datos a actualizar
   * @returns Zona actualizada
   */
  async update(id: string, dto: UpdateZoneDto) {
    const zone = await this.findOne(id);
    Object.assign(zone, dto);

    if (dto.municipalityId) {
      zone.municipality = { id: dto.municipalityId } as any;
    }

    return this.zoneRepo.save(zone);
  }

  /**
   * Archiva una zona (soft delete).
   * @param id - ID de la zona a archivar
   * @throws NotFoundException si no existe (404)
   * @returns Mensaje de confirmación con statusCode 200
   */
  async remove(id: string) {
    const zone = await this.findOne(id);
    zone.isArchived = true;
    zone.archivedAt = new Date();
    await this.zoneRepo.save(zone);
    return { statusCode: 200, message: 'Zone archivado exitosamente' };
  }
}
