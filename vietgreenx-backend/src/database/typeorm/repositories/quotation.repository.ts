import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Quotation } from '../entities/agriculture/quotation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QuotationRepository extends BaseRepository<Quotation> {
	constructor(
		@InjectRepository(Quotation)
		private readonly quotationRepo: Repository<Quotation>,
	) {
		super(quotationRepo);
	}
}
