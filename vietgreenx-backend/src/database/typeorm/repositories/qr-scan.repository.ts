import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { QrScan } from '../entities';
import { IQrScanRepository } from '../interfaces/qr-scan.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QrScanRepository
	extends BaseRepository<QrScan>
	implements IQrScanRepository
{
	constructor(
		@InjectRepository(QrScan)
		private readonly qrScanRepo: Repository<QrScan>,
	) {
		super(qrScanRepo);
	}
}
