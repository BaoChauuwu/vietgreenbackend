import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../entities';

@Injectable()
export class MediaRepository extends BaseRepository<Media> {
	constructor(
		@InjectRepository(Media)
		private readonly mediaRepo: Repository<Media>,
	) {
		super(mediaRepo);
	}
}
