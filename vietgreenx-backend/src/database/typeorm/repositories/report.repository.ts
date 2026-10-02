import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Report } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class ReportRepository extends BaseRepository<Report> {
	constructor(
		@InjectRepository(Report)
		private readonly reportRepo: Repository<Report>,
	) {
		super(reportRepo);
	}

	async updateWhere(
		criteria: FindOptionsWhere<Report>,
		values: Partial<Report>,
	): Promise<void> {
		await this.reportRepo.update(criteria, values as any);
	}
}
