import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../entities/agriculture/batch.entity';
@Injectable()
export class BatchRepository extends BaseRepository<Batch> {
	constructor(
		@InjectRepository(Batch)
		private readonly batchRepo: Repository<Batch>,
	) {
		super(batchRepo);
	}
}
