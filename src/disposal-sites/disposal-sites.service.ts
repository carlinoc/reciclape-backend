import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisposalSite } from './entities/disposal-site.entity';
import { CreateDisposalSiteDto } from './dto/create-disposal-site.dto';
import { UpdateDisposalSiteDto } from './dto/update-disposal-site.dto';
import { FilterDisposalSitesDto } from './dto/filter-disposal-sites.dto';

@Injectable()
export class DisposalSitesService {
  constructor(
    @InjectRepository(DisposalSite)
    private readonly repo: Repository<DisposalSite>,
  ) {}

  async create(dto: CreateDisposalSiteDto): Promise<DisposalSite> {
    const site = this.repo.create(dto);
    return this.repo.save(site);
  }

  async findAll(filter: FilterDisposalSitesDto): Promise<DisposalSite[]> {
    const qb = this.repo
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.municipality', 'municipality');

    if (filter.municipalityId) {
      qb.andWhere('site.municipalityId = :municipalityId', {
        municipalityId: filter.municipalityId,
      });
    }

    if (filter.isActive !== undefined) {
      qb.andWhere('site.isActive = :isActive', { isActive: filter.isActive });
    }

    qb.andWhere('site.isArchived = false').orderBy('site.name', 'ASC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<DisposalSite> {
    const site = await this.repo.findOne({
      where: { id },
      relations: ['municipality'],
    });
    if (!site) throw new NotFoundException('Sitio de disposición no encontrado');
    return site;
  }

  async update(id: string, dto: UpdateDisposalSiteDto): Promise<DisposalSite> {
    const site = await this.findOne(id);
    Object.assign(site, dto);
    return this.repo.save(site);
  }

  async remove(id: string) {
    const site = await this.findOne(id);
    site.isArchived = true;
    site.archivedAt = new Date();
    await this.repo.save(site);
    return { statusCode: 200, message: 'Sitio de disposición archivado exitosamente' };
  }
}
