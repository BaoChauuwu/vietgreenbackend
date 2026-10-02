import { Injectable } from '@nestjs/common';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { UpdateProfileRequestDto } from './dto/requests/update-profile.request.dto';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { MediaUploadService } from '@app/modules/app/media/media-upload.service';
import { BlockService } from '@app/modules/app/block/block.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { RedisService } from '@app/services/redis/redis.service';
import { CacheKeys, CacheTtl } from '@app/common/constants/cache-keys';
import { QuotationRepository } from '@app/database/typeorm/repositories/quotation.repository';

@Injectable()
export class UserProfileService {
	constructor(
		private readonly profileRepository: ProfileRepository,
		private readonly mediaRepository: MediaRepository,
		private readonly mediaUploadService: MediaUploadService,
		private readonly blockService: BlockService,
		private readonly userRepository: UserRepository,
		private readonly redis: RedisService,
		private readonly quotationRepository: QuotationRepository,
	) {}

	async searchUsers(viewerId: string, q: string, limit: number) {
		const term = q.trim().replace(/[%_\\]/g, '\\$&');
		const safeLimit = Math.min(Math.max(limit, 1), 20);

		const users = await this.userRepository
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.where('user.status = :status', { status: UserStatus.ACTIVE })
			.andWhere('user.id != :viewerId', { viewerId })
			.andWhere(
				"(user.username ILIKE :prefix ESCAPE '\\' OR profile.displayName ILIKE :contains ESCAPE '\\')",
				{
					prefix: `${term}%`,
					contains: `%${term}%`,
				},
			)
			.orderBy('user.username', 'ASC')
			.take(safeLimit)
			.getMany();

		return {
			items: users.map((user) => ({
				id: user.id,
				username: user.username,
				displayName: user.profile?.displayName ?? null,
				avatarUrl: user.profile?.avatarMedia?.cdnUrl ?? null,
			})),
		};
	}

	async getProfile(userId: string, viewerId: string): Promise<Profile> {
		// Block check is viewer-specific and must run before cache lookup.
		if (
			userId !== viewerId &&
			(await this.blockService.isEitherBlocked(viewerId, userId))
		) {
			throw new HttpNotFoundError(ErrorCode.PROFILE_NOT_FOUND);
		}

		// Profile data itself is viewer-agnostic (all callers who pass the block
		// check see the same fields) so we cache under userId only.
		return this.redis.getOrSet(
			CacheKeys.profile(userId),
			CacheTtl.PROFILE_SECONDS,
			async () => {
				const profile = await this.profileRepository.findOne({ userId }, [
					'avatarMedia',
					'coverMedia',
				]);
				// Throw inside the fetcher so getOrSet never caches a "not found" result.
				if (!profile) throw new HttpNotFoundError(ErrorCode.PROFILE_NOT_FOUND);
				// Normalize Date fields to ISO strings before caching so both cache-hit
				// and cache-miss paths return an identical structure. Without this,
				// cache-miss returns Date objects while cache-hit returns strings —
				// callers using .getTime() or date arithmetic on the miss path would
				// crash on subsequent cache-hit requests.
				return JSON.parse(JSON.stringify(profile)) as typeof profile;
			},
		);
	}

	async updateProfile(
		userId: string,
		dto: UpdateProfileRequestDto,
	): Promise<Profile> {
		const { avatarMediaId, coverMediaId, ...profileData } = dto;
		const changes: Parameters<typeof this.profileRepository.update>[1] = {
			...profileData,
		};

		if (avatarMediaId !== undefined) {
			if (avatarMediaId === null) {
				changes.avatarMediaId = null;
			} else {
				const media = await this.mediaRepository.findOne({ id: avatarMediaId });
				if (!media) throw new HttpNotFoundError(ErrorCode.MEDIA_NOT_FOUND);
				this.mediaUploadService.assertMediaReadyForAvatar(media, userId);
				changes.avatarMediaId = avatarMediaId;
			}
		}

		if (coverMediaId !== undefined) {
			if (coverMediaId === null) {
				changes.coverMediaId = null;
			} else {
				const media = await this.mediaRepository.findOne({ id: coverMediaId });
				if (!media) throw new HttpNotFoundError(ErrorCode.MEDIA_NOT_FOUND);
				this.mediaUploadService.assertMediaReadyForCover(media, userId);
				changes.coverMediaId = coverMediaId;
			}
		}

		if (Object.keys(changes).length > 0) {
			await this.profileRepository.update({ userId }, changes);
		}

		// Invalidate profile cache and all feed caches that embed the author's avatar.
		await Promise.all([
			this.redis.del(CacheKeys.profile(userId)),
			this.redis.delPattern(CacheKeys.feedDiscoveryPattern()),
		]);
		return this.getProfile(userId, userId);
	}

	async getTransactionHistory(userId: string, page: number, limit: number) {
		const { items, total } = await this.quotationRepository.findWithPagination(
			page,
			limit,
			{
				where: [{ senderUserId: userId }, { receiverUserId: userId }],
				relations: [
					'product',
					'sender',
					'sender.profile',
					'receiver',
					'receiver.profile',
				],
				order: { createdAt: 'DESC' },
			},
		);

		const mapped = items.map((q) => {
			const isSender = q.senderUserId === userId;
			const partner = isSender ? q.receiver : q.sender;
			return {
				id: q.id,
				direction: isSender ? 'sent' : 'received',
				status: q.status,
				productId: q.productId,
				productName: q.product?.name ?? null,
				quantity: q.quantity,
				quantityUnit: q.quantityUnit,
				validUntil: q.validUntil,
				partner: {
					userId: partner?.id ?? (isSender ? q.receiverUserId : q.senderUserId),
					displayName: (partner as any)?.profile?.displayName ?? null,
					avatarUrl: null,
				},
				createdAt: q.createdAt,
			};
		});

		return {
			items: mapped,
			total,
			page,
			limit,
			totalPage: Math.ceil(total / limit),
		};
	}
}
