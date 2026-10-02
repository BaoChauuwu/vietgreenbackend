import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from '../entities';
@Injectable()
export class ProfileRepository extends BaseRepository<Profile> {
	constructor(
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
	) {
		super(profileRepo);
	}
}
