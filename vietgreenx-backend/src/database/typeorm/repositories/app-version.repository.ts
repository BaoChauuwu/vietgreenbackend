import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { AppVersion } from '../entities/system/app-version.entity';

@Injectable()
export class AppVersionRepository extends BaseRepository<AppVersion> {
	constructor(
		@InjectRepository(AppVersion)
		private readonly appVersionRepo: Repository<AppVersion>,
	) {
		super(appVersionRepo);
	}
}
