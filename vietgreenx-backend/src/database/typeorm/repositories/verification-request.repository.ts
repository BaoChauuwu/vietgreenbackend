import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequest } from '../entities';

@Injectable()
export class VerificationRequestRepository extends BaseRepository<VerificationRequest> {
	constructor(
		@InjectRepository(VerificationRequest)
		private readonly repo: Repository<VerificationRequest>,
	) {
		super(repo);
	}
}
