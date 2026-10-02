import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrQuotaTracking } from '../entities/agriculture/qr-quota-tracking.entity';

@Injectable()
export class QrQuotaTrackingRepository extends BaseRepository<QrQuotaTracking> {
	constructor(
		@InjectRepository(QrQuotaTracking)
		private readonly qrQuotaTrackingRepo: Repository<QrQuotaTracking>,
	) {
		super(qrQuotaTrackingRepo);
	}
}
