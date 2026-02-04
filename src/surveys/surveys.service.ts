import {
    BadRequestException,
    ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { FilterSurveysDto } from './dto/filter-surveys.dto';
import { MunicipalitiesService } from '../municipalities/municipalities.service';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    private readonly municipalitiesService: MunicipalitiesService,
  ) {}

  async create(dto: CreateSurveyDto): Promise<Survey> {
    //Verificar que el id de la municipalidad sea válido
    if(!dto.municipalityId){
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    //Verificar la municipalidad exista en la base de datos
    const municipality = await this.municipalitiesService.findOne(dto.municipalityId);
    if(!municipality){
      throw new BadRequestException('La municipalidad no existe');
    }

    //verificar que la fecha de inicio sea anterior a la de fin
    if(dto.startDate && dto.endDate && dto.startDate > dto.endDate){
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la de fin');
    }

    //verificar que la fecha de inicio no se menor a la fecha actual
    if(dto.startDate && new Date(dto.startDate) < new Date()){
      throw new BadRequestException('La fecha de inicio no puede ser anterior a la fecha actual');
    }

    //La encuesta debe tener al menos una pregunta
    if(dto.totalQuestions < 1){
      throw new BadRequestException('La encuesta debe tener al menos una pregunta');
    }

    //verificar que no exista encuesta activa para el municipio
    const activeSurvey = await this.surveyRepo.findOne({
      where: { municipalityId: dto.municipalityId, isActive: true },
    });

    if(activeSurvey){
      throw new BadRequestException('Ya existe una encuesta activa para el municipio');
    }

    //Verificar que no exista una encuesta con el mismo nombre para el municipio
    const existingSurvey = await this.surveyRepo.findOne({
      where: { municipalityId: dto.municipalityId, title: dto.title },
    });
    if (existingSurvey) throw new ConflictException('Ya existe una encuesta con el mismo nombre para el municipio');
    
    const survey = this.surveyRepo.create(dto);
    return this.surveyRepo.save(survey);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    const queryBuilder = this.surveyRepo.createQueryBuilder('survey')
        .leftJoinAndSelect('survey.municipality', 'municipality')
        .where('municipality.id = :municipalityId', { municipalityId });
    
    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('survey.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('survey.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('survey.isArchived = false'); 
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('survey.title', 'ASC');

    return await queryBuilder.getMany();
  }  

  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.surveyRepo.createQueryBuilder('survey');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('survey.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('survey.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('survey.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('survey.title', 'ASC');

    return await queryBuilder.getMany(); 
  }

  async findOne(id: string ): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { id},
      relations: ['municipality'],
    });

    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }

    return survey;
  }

  async update(
    id: string,
    dto: UpdateSurveyDto,
  ): Promise<Survey> {

    const survey = await this.findOne(id);
    //Verificar que la encuesta no este archivada
    if(survey.isArchived){
      throw new BadRequestException('No se puede actualizar una encuesta archivada');
    }

    Object.assign(survey, dto);
    
    return this.surveyRepo.save(survey);
  }

  async remove(id: string) {
    const survey = await this.findOne(id);
    survey.isActive = false;
    survey.isArchived = true;
    survey.archivedAt = new Date();

    await this.surveyRepo.save(survey);

    return { statusCode: 200, message: 'Encuesta archivada exitosamente' };
  }
}
