import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraceHash } from '../entities/agriculture/trace-hash.entity';

@Injectable()
export class TraceHashRepository extends BaseRepository<TraceHash> {
	constructor(
		@InjectRepository(TraceHash)
		private readonly traceHashRepo: Repository<TraceHash>,
	) {
		super(traceHashRepo);
	}

	async findLatestForEntity(
		entityType: string,
		entityId: string,
	): Promise<TraceHash | null> {
		return this.traceHashRepo.findOne({
			where: { entityType, entityId },
			order: { chainIndex: 'DESC' },
		});
	}

	async findAllForEntity(
		entityType: string,
		entityId: string,
	): Promise<TraceHash[]> {
		return this.traceHashRepo.find({
			where: { entityType, entityId },
			order: { chainIndex: 'ASC' },
		});
	}
}
