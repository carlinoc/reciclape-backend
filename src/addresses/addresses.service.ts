import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async create(dto: CreateAddressDto) {
    const address = this.addressRepo.create({
      userId: dto.userId,
      districtId: dto.districtId,
      zoneId: dto.zoneId,
      street: dto.street,
      number: dto.number,
      apartment: dto.apartment,
      qrCode: dto.qrCode,
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
    } as Partial<Address>);
    return this.addressRepo.save(address);
  }

  findAll() {
    return this.addressRepo.find({
      relations: ['zone', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const address = await this.addressRepo.findOne({
      where: { id },
      relations: ['zone', 'user'],
    });

    if (!address) throw new NotFoundException('Address not found');

    return address;
  }

  async update(id: string, dto: UpdateAddressDto) {
    const address = await this.findOne(id);
    Object.assign(address, dto);
    await this.addressRepo.save(address);
    return this.findOne(id);
  }

  async remove(id: string) {
    const address = await this.findOne(id);
    await this.addressRepo.remove(address);
    return { message: 'Address deleted successfully' };
  }
}
