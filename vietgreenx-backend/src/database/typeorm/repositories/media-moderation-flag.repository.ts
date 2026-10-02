import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { MediaModerationFlag } from '../entities/moderation/media-moderation-flag.entity';
import { ModerationVerdict } from '@app/common/enums/moderation-verdict.enum';

export interface UpsertFlagData {
	mediaId: string;
	ownerId: string;
	verdict: ModerationVerdict;
	exifSuspicious: boolean;
	matchedMediaId: string | null;
	matchedOwnerId: string | null;
	distance: number | null;
	details: Record<string, unknown> | null;
}

@Injectable()
export class MediaModerationFlagRepository extends BaseRepository<MediaModerationFlag> {
	constructor(
		@InjectRepository(MediaModerationFlag)
		private readonly flagRepo: Repository<MediaModerationFlag>,
	) {
		super(flagRepo);
	}

	async upsertResult(data: UpsertFlagData): Promise<void> {
		await this.repository.upsert(
			{
				mediaId: data.mediaId,
				ownerId: data.ownerId,
				verdict: data.verdict,
				exifSuspicious: data.exifSuspicious,
				matchedMediaId: data.matchedMediaId,
				matchedOwnerId: data.matchedOwnerId,
				distance: data.distance,
				details: data.details as unknown as null,
				status: 'pending',
			},
			['mediaId'],
		);
	}
}
