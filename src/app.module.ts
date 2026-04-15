import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DistrictsModule } from './districts/districts.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProvincesModule } from './provinces/provinces.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ZonesModule } from './zones/zones.module';
import { DevicesModule } from './devices/devices.module';
import { TrucksModule } from './trucks/trucks.module';
import { TruckTypeModule } from './truck-type/truck-type.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FleetModule } from './fleet/fleet.module';
import { TruckPositionsModule } from './truck-positions/truck-positions.module';
import { UsersModule } from './users/users.module';
import { CollectionAreasModule } from './collection-areas/collection-areas.module';
import { RouteSchedulesModule } from './route-schedules/route-schedules.module';
import { SurveysModule } from './surveys/surveys.module';
import { SurveyQuestionsModule } from './survey-questions/survey-questions.module';
import { RewardsCatalogModule } from './rewards-catalog/rewards-catalog.module';
import { RecyclingTypeModule } from './recycling-type/recycling-type.module';
import { AuthModule } from './auth/auth.module';
import { DailyCrewAssignmentsModule } from './daily-crew-assignments/daily-crew-assignments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollectionsModule } from './collections/collections.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { DebugModule } from './debug/debug.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CollectionAreaTypesModule } from './collection-area-types/collection-area-types.module';
import { DisposalSitesModule } from './disposal-sites/disposal-sites.module';
import { TruckTripsModule } from './truck-trips/truck-trips.module';
import { TruckConvoysModule } from './truck-convoys/truck-convoys.module';
import { WorkSchedulesModule } from './work-schedules/work-schedules.module';
import { ComplaintsModule } from './complaints/complaints.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Configura Redis aquí una sola vez para TODO el proyecto
     RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('redis.url'),
      }),
    }),

    // Configurar la conexión a la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseurl = config.get<string>('DATABASE_URL');

        return databaseurl
          ? {
              type: 'postgres',
              url: databaseurl,
              ssl: {
                rejectUnauthorized: false, // Esto es clave para conexiones externas
              },
              entities: [__dirname + '/**/*.entity{.ts,.js}'],
              synchronize: false,
              autoLoadEntities: true,
              retryAttempts: 2,   
              retryDelay: 3000,
            }
            : {
              type: 'postgres',
              host: config.get<string>('database.host'),
              port: config.get<number>('database.port'),
              username: config.get<string>('database.user'),
              password: config.get<string>('database.password'),
              database: config.get<string>('database.name'),
              synchronize: false,
              autoLoadEntities: true,
            }
      }
    }),

    AuthModule,
    DepartmentsModule,
    ProvincesModule,
    DistrictsModule,
    MunicipalitiesModule,
    ZonesModule,
    DevicesModule,
    CollectionAreaTypesModule,
    CollectionAreasModule,
    TruckTypeModule,
    TrucksModule,
    TruckPositionsModule,
    FleetModule,
    DashboardModule,
    RouteSchedulesModule,
    SurveysModule,
    SurveyQuestionsModule,
    RewardsCatalogModule,
    RecyclingTypeModule,
    UsersModule,
    DailyCrewAssignmentsModule,
    NotificationsModule,
    CollectionsModule,
    VouchersModule,
    DisposalSitesModule,
    TruckTripsModule,
    TruckConvoysModule,
    WorkSchedulesModule,
    ComplaintsModule,
    // SEC-03: DebugModule solo disponible fuera de producción
    ...(process.env.NODE_ENV !== 'production' ? [DebugModule] : []),
  ],
  providers: [
    // SEC-01: Guard JWT global — protege TODOS los endpoints automáticamente.
    // Para marcar un endpoint como público usar el decorador @Public()
    // (ej: endpoints de login, POST /truck-positions, GET /ubigeo/*)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }