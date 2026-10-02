import { Injectable } from '@nestjs/common';
import { Follow } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { FollowQueryRequestDto } from '@app/modules/app/follow/dto/requests/follow-query.request.dto';
import { FollowStatus } from '@app/common/enums/follow-status.enum';

@Injectable()
export class FollowRepository extends BaseRepository<Follow> {
	constructor(
		@InjectRepository(Follow)
		private readonly followRepo: Repository<Follow>,
	) {
		super(followRepo);
	}

	async findExistingRow(
		followerId: string,
		target: { followeeUserId?: string; followeeOrgId?: string },
	): Promise<Follow | null> {
		return this.followRepo.findOne({
			where: {
				followerId,
				...target,
			},
		});
	}

	async getFollower(
		userId: string,
		query: FollowQueryRequestDto,
		excludeUserIds: string[] = [],
	) {
		const qb = this.createQueryBuilder('follow')
			.leftJoinAndSelect('follow.follower', 'follower')
			.leftJoinAndSelect('follower.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.where('follow.followeeUserId = :userId', { userId })
			.andWhere('follow.status = :status', { status: FollowStatus.ACTIVE })
			.orderBy('follow.createdAt', 'DESC')
			.addOrderBy('follow.id', 'DESC');

		if (excludeUserIds.length > 0) {
			qb.andWhere('follow.followerId NOT IN (:...excludeUserIds)', {
				excludeUserIds,
			});
		}

		return this.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			query.cursor,
			query.limit,
		);
	}

	async getFollowing(
		userId: string,
		query: FollowQueryRequestDto,
		excludeUserIds: string[] = [],
	) {
		const qb = this.createQueryBuilder('follow')
			.leftJoinAndSelect('follow.followeeUser', 'followeeUser')
			.leftJoinAndSelect('followeeUser.profile', 'userProfile')
			.leftJoinAndSelect('userProfile.avatarMedia', 'userAvatarMedia')
			.leftJoinAndSelect('follow.followeeOrg', 'followeeOrg')
			.leftJoinAndSelect('followeeOrg.logoMedia', 'orgLogoMedia')
			.where('follow.followerId = :userId', { userId })
			.andWhere('follow.status = :status', { status: FollowStatus.ACTIVE })
			.orderBy('follow.createdAt', 'DESC')
			.addOrderBy('follow.id', 'DESC');

		if (excludeUserIds.length > 0) {
			qb.andWhere(
				'follow.followeeUserId IS NULL OR follow.followeeUserId NOT IN (:...excludeUserIds)',
				{
					excludeUserIds,
				},
			);
		}

		return this.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			query.cursor,
			query.limit,
		);
	}

	async findActiveFollow(
		followerId: string,
		targetId: string,
	): Promise<Follow | null> {
		return this.followRepo.findOne({
			where: [
				{
					followerId,
					followeeUserId: targetId,
					status: In([FollowStatus.ACTIVE, FollowStatus.PENDING]),
				},
				{
					followerId,
					followeeOrgId: targetId,
					status: FollowStatus.ACTIVE,
				},
			],
		});
	}
}
