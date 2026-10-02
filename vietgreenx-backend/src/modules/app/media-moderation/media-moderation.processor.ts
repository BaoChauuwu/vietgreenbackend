import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { MEDIA_MODERATION_QUEUE } from './media-moderation.queue';
import { ModerateMediaJob } from './dto/media-moderation-job.dto';
import { ModerationVerdict } from '@app/common/enums/moderation-verdict.enum';
import { phash, dhash } from './checks/phash.util';
import { exifSuspicious } from './checks/exif.util';
import { hammingBigInt } from './checks/hamming.util';
import { toUnsigned64 } from '@app/common/utils/bigint.util';
import { MediaHashRepository } from '@app/database/typeorm/repositories/media-hash.repository';
import { MediaModerationFlagRepository } from '@app/database/typeorm/repositories/media-moderation-flag.repository';

const MAX_DIST = 10;

@Processor(MEDIA_MODERATION_QUEUE, { concurrency: 3 })
export class MediaModerationProcessor extends WorkerHost {
	private readonly logger = new Logger(MediaModerationProcessor.name);

	constructor(
		private readonly s3: S3Service,
		private readonly hashRepo: MediaHashRepository,
		private readonly flagRepo: MediaModerationFlagRepository,
	) {
		super();
	}

	async process(job: Job<ModerateMediaJob>): Promise<void> {
		const { mediaId, ownerId, storageKey, purpose } = job.data;
		try {
			const buf = await this.s3.downloadToBuffer(storageKey);
			const [ph, dh, exifBad] = await Promise.all([
				phash(buf),
				dhash(buf),
				exifSuspicious(buf),
			]);

			const candidates = await this.hashRepo.findByPurpose(purpose);
			let best: { mediaId: string; ownerId: string; dist: number } | null =
				null;
			for (const c of candidates) {
				if (c.mediaId === mediaId) continue;
				const dist = Math.min(
					hammingBigInt(ph, toUnsigned64(BigInt(c.phash))),
					hammingBigInt(dh, toUnsigned64(BigInt(c.dhash))),
				);
				if (dist <= MAX_DIST && (!best || dist < best.dist))
					best = { mediaId: c.mediaId, ownerId: c.ownerId, dist };
			}

			let verdict = ModerationVerdict.OK;
			if (best && best.ownerId !== ownerId) verdict = ModerationVerdict.STOLEN;
			else if (best) verdict = ModerationVerdict.REPOSTED;
			else if (exifBad) verdict = ModerationVerdict.SUSPICIOUS;

			await this.flagRepo.upsertResult({
				mediaId,
				ownerId,
				verdict,
				exifSuspicious: exifBad,
				matchedMediaId: best?.mediaId ?? null,
				matchedOwnerId: best?.ownerId ?? null,
				distance: best?.dist ?? null,
				details: { phash: ph.toString(), dhash: dh.toString(), purpose },
			});

			if (
				verdict === ModerationVerdict.OK ||
				verdict === ModerationVerdict.SUSPICIOUS
			) {
				await this.hashRepo.saveHash({
					mediaId,
					ownerId,
					purpose,
					phash: ph,
					dhash: dh,
				});
			}

			this.logger.log(`media ${mediaId} → ${verdict}`);
		} catch (error) {
			this.logger.error(
				`Moderation failed for media ${mediaId} (job ${job.id})`,
				error instanceof Error ? error.stack : error,
			);
			throw error;
		}
	}
}
