import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicTraceToken } from '../entities/agriculture/public-trace-token.entity';

@Injectable()
export class PublicTraceTokenRepository extends BaseRepository<PublicTraceToken> {
	constructor(
		@InjectRepository(PublicTraceToken)
		private readonly publicTraceTokenRepo: Repository<PublicTraceToken>,
	) {
		super(publicTraceTokenRepo);
	}
}
