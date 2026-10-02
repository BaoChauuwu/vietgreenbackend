import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionLog } from '../entities/agriculture/production-log.entity';
@Injectable()
export class ProductionLogRepository extends BaseRepository<ProductionLog> {
	constructor(
		@InjectRepository(ProductionLog)
		private readonly productionLogRepo: Repository<ProductionLog>,
	) {
		super(productionLogRepo);
	}
}
