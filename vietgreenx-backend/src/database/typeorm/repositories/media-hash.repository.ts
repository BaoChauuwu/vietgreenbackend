import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { MediaHash } from '../entities/moderation/media-hash.entity';
import { toSigned64 } from '@app/common/utils/bigint.util';

@Injectable()
export class MediaHashRepository extends BaseRepository<MediaHash> {
	constructor(
		@InjectRepository(MediaHash)
		private readonly mediaHashRepo: Repository<MediaHash>,
	) {
		super(mediaHashRepo);
	}

	findByPurpose(purpose: string): Promise<MediaHash[]> {
		return this.repository.find({ where: { purpose }, take: 5000 });
	}

	async saveHash(d: {
		mediaId: string;
		ownerId: string;
		purpose: string;
		phash: bigint;
		dhash: bigint;
	}): Promise<void> {
		await this.repository.upsert(
			{
				mediaId: d.mediaId,
				ownerId: d.ownerId,
				purpose: d.purpose,
				phash: toSigned64(d.phash).toString(),
				dhash: toSigned64(d.dhash).toString(),
			},
			['mediaId'],
		);
	}
}
