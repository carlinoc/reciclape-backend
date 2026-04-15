import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisposalSitesService } from './disposal-sites.service';
import { DisposalSitesController } from './disposal-sites.controller';
import { DisposalSite } from './entities/disposal-site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisposalSite])],
  controllers: [DisposalSitesController],
  providers: [DisposalSitesService],
  exports: [DisposalSitesService],
})
export class DisposalSitesModule {}
