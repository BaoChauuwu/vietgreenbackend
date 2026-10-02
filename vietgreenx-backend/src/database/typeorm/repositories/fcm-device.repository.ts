import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { FcmDevice } from '../entities/identity/fcm-device.entity';

@Injectable()
export class FcmDeviceRepository extends BaseRepository<FcmDevice> {
	constructor(
		@InjectRepository(FcmDevice)
		private readonly fcmDeviceRepo: Repository<FcmDevice>,
	) {
		super(fcmDeviceRepo);
	}
}
