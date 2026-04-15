import { PartialType } from '@nestjs/swagger';
import { CreateDisposalSiteDto } from './create-disposal-site.dto';

export class UpdateDisposalSiteDto extends PartialType(CreateDisposalSiteDto) {}
