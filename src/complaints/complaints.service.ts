import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { ComplaintCategory } from './entities/complaint-category.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintsDto } from './dto/filter-complaints.dto';
import { FilterComplaintCategoriesDto } from './dto/filter-complaint-categories.dto';
import { CreateComplaintCategoryDto } from './dto/create-complaint-category.dto';
import { paginate } from 'src/common/dto/pagination.dto';
import { Address } from 'src/users/entities/address.entity';
import { Zone } from 'src/zones/entities/zones.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(ComplaintCategory)
    private readonly categoryRepo: Repository<ComplaintCategory>,
    private readonly dataSource: DataSource,
  ) {}

  // ── COMPLAINTS ────────────────────────────────────────────────────────────

  async create(dto: CreateComplaintDto): Promise<Complaint> {
    // Auto-resolver address, zoneId y municipalityId desde el vecino si no vienen en el DTO
    let { address, zoneId, municipalityId, latitude, longitude } = dto as any;

    if (!address || !zoneId || !municipalityId) {
      const address_entity = await this.dataSource
        .getRepository(Address)
        .findOne({ where: { userId: dto.userId } });

      if (address_entity) {
        // address: use DTO value if provided, otherwise build from the stored address
        if (!address && address_entity.street) {
          address = address_entity.street;
        }
        if (!municipalityId) {
          const user = await this.dataSource.query(
            `SELECT "municipalityId" FROM users WHERE id = $1 LIMIT 1`,
            [dto.userId]
          );
          municipalityId = user[0]?.municipalityId ?? dto.municipalityId;
        }

        // Auto-detectar zona por zona más cercana al centroide
        if (!zoneId && !address_entity.zoneId) {
          // Extraer lat/lng de la dirección del vecino
          const coords = await this.dataSource.query(
            `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
             FROM addresses WHERE id = $1 LIMIT 1`,
            [address_entity.id]
          );
          if (coords[0]?.lat && coords[0]?.lng) {
            latitude  = latitude  ?? parseFloat(coords[0].lat);
            longitude = longitude ?? parseFloat(coords[0].lng);
          }
          zoneId = address_entity.zoneId || null;
        } else {
          zoneId = zoneId || address.zoneId || null;
        }

        // Si tenemos lat/lng (del vecino o del reclamo) buscar zona más cercana
        const lat = latitude  ?? (dto as any).latitude;
        const lng = longitude ?? (dto as any).longitude;

        if (!zoneId && lat && lng) {
          const nearestZone = await this.dataSource.query(`
            SELECT id,
              SQRT(POWER("centerLatitude"  - $1, 2) +
                   POWER("centerLongitude" - $2, 2)) AS dist
            FROM zones
            WHERE "municipalityId" = $3
              AND "isArchived" = false
              AND "isActive"   = true
              AND "centerLatitude"  IS NOT NULL
              AND "centerLongitude" IS NOT NULL
            ORDER BY dist ASC
            LIMIT 1
          `, [lat, lng, municipalityId]);
          if (nearestZone[0]) zoneId = nearestZone[0].id;
        }
      }
    }

    const complaintData: Partial<Complaint> = {
      ...dto as any,
      address:        address        || undefined,
      zoneId:         zoneId         || undefined,
      municipalityId: municipalityId || dto.municipalityId,
    };
    const complaint = this.complaintRepo.create(complaintData as Complaint);
    return this.complaintRepo.save(complaint);
  }

  async findAll(filters: FilterComplaintsDto) {
    const { municipalityId, userId, categoryId, status, page = 1, limit = 20 } = filters;

    const qb = this.complaintRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user',         'user')
      .leftJoinAndSelect('c.category',     'category')
      .leftJoinAndSelect('c.municipality', 'municipality');

    if (municipalityId) qb.andWhere('c.municipalityId = :municipalityId', { municipalityId });
    if (userId)         qb.andWhere('c.userId = :userId',                 { userId });
    if (categoryId)     qb.andWhere('c.categoryId = :categoryId',         { categoryId });
    if (status)         qb.andWhere('c.status = :status',                 { status });

    qb.orderBy('c.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintRepo.findOne({
      where: { id },
      relations: ['user', 'category', 'municipality'],
    });
    if (!complaint) throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto): Promise<Complaint> {
    const complaint = await this.findOne(id);
    Object.assign(complaint, dto);
    return this.complaintRepo.save(complaint);
  }

  async remove(id: string) {
    const complaint = await this.findOne(id);
    await this.complaintRepo.remove(complaint);
    return { statusCode: 200, message: `Reclamo ${id} eliminado correctamente` };
  }

  // ── CATEGORIES ────────────────────────────────────────────────────────────

  async createCategory(dto: CreateComplaintCategoryDto): Promise<ComplaintCategory> {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async findAllCategories(filters: FilterComplaintCategoriesDto): Promise<ComplaintCategory[]> {
    const qb = this.categoryRepo.createQueryBuilder('cat');

    if (filters.municipalityId !== undefined) {
      qb.andWhere('cat.municipalityId = :municipalityId', { municipalityId: filters.municipalityId });
    }
    if (filters.isActive !== undefined) {
      qb.andWhere('cat.isActive = :isActive', { isActive: filters.isActive });
    }

    return qb.orderBy('cat.name', 'ASC').getMany();
  }

  async findOneCategory(id: string): Promise<ComplaintCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    return category;
  }

  async updateCategory(id: string, dto: Partial<CreateComplaintCategoryDto>): Promise<ComplaintCategory> {
    const category = await this.findOneCategory(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async removeCategory(id: string) {
    const category = await this.findOneCategory(id);
    await this.categoryRepo.remove(category);
    return { statusCode: 200, message: `Categoría ${id} eliminada correctamente` };
  }
}
