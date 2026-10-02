import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropSeason } from '../entities';

@Injectable()
export class CropSeasonRepository extends BaseRepository<CropSeason> {
	constructor(
		@InjectRepository(CropSeason)
		private readonly cropSeasonRepo: Repository<CropSeason>,
	) {
		super(cropSeasonRepo);
	}
}
