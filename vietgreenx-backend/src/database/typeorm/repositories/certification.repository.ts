import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from '../entities/agriculture/certification.entity';

@Injectable()
export class CertificationRepository extends BaseRepository<Certification> {
	constructor(
		@InjectRepository(Certification)
		private readonly certificationRepo: Repository<Certification>,
	) {
		super(certificationRepo);
	}
}
