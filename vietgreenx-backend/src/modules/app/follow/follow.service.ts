import {
	ErrorCode,
	HttpBadRequestError,
	HttpConflictError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { FollowRepository } from '@app/database/typeorm/repositories/follow.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { FollowStatus } from '@app/common/enums/follow-status.enum';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FollowCreatedEvent } from './events/follow-created.event';
import { FollowRemovedEvent } from './events/follow-removed.event';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { Organization } from '@app/database/typeorm/entities/identity/organization.entity';
import { FollowQueryRequestDto } from './dto/requests/follow-query.request.dto';
import { FollowItemResponseDto } from './dto/responses/follow-list.response.dto';
import { EntityManager } from 'typeorm';

@Injectable()
export class FollowService {
	private readonly logger = new Logger(FollowService.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly blockService: BlockService,
		private readonly followRepository: FollowRepository,
		private readonly profileRepository: ProfileRepository,
		private readonly organizationRepository: OrganizationRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async followUser(
		followerId: string,
		target: { followeeUserId?: string; followeeOrgId?: string },
	) {
		const { followeeUserId, followeeOrgId } = target;

		if (followeeUserId) {
			const followee = await this.userRepository.findById(followeeUserId);
			if (!followee) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);

			if (followeeUserId === followerId)
				throw new HttpForbiddenError(ErrorCode.FOLLOW_SELF);

			const isBlocked = await this.blockService.isEitherBlocked(
				followerId,
				followeeUserId,
			);
			if (isBlocked) throw new HttpForbiddenError(ErrorCode.USER_NOT_FOUND);

			const existing = await this.followRepository.findExistingRow(followerId, {
				followeeUserId,
			});

			if (existing?.status === FollowStatus.ACTIVE)
				throw new HttpConflictError(ErrorCode.USER_ALREADY_FOLLOWED);

			if (existing?.status === FollowStatus.PENDING)
				throw new HttpConflictError(ErrorCode.FOLLOW_REQUEST_ALREADY_PENDING);

			const profile = await this.profileRepository.findOne({
				userId: followeeUserId,
			});

			const status = profile?.isPrivate
				? FollowStatus.PENDING
				: FollowStatus.ACTIVE;

			let followRecord: Follow | null;
			if (existing) {
				followRecord = await this.followRepository.update(existing.id, {
					status,
				});
			} else {
				followRecord = await this.followRepository.create({
					followerId,
					followeeUserId,
					status,
				});
			}

			if (
				(status === FollowStatus.ACTIVE || status === FollowStatus.PENDING) &&
				followRecord
			) {
				this.eventEmitter.emit(
					'follow.created',
					new FollowCreatedEvent(followRecord),
				);
			}

			return { status };
		}

		if (followeeOrgId) {
			const followeeOrg =
				await this.organizationRepository.findById(followeeOrgId);

			if (!followeeOrg)
				throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);

			if (!followeeOrg.isActive)
				throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);

			const existing = await this.followRepository.findExistingRow(followerId, {
				followeeOrgId,
			});

			if (existing?.status === FollowStatus.ACTIVE)
				throw new HttpConflictError(ErrorCode.ORGANIZATION_ALREADY_FOLLOWED);

			let followRecord: Follow | null;
			await this.followRepository.executeInTransaction(async (manager) => {
				if (existing) {
					followRecord = await this.followRepository.update(existing.id, {
						status: FollowStatus.ACTIVE,
					});
				} else {
					followRecord = await this.followRepository.create({
						followerId,
						followeeOrgId,
						status: FollowStatus.ACTIVE,
					});
				}
				await this.incrementOrgFollowerCount(followeeOrgId, manager);
			});

			if (followRecord!) {
				this.eventEmitter.emit(
					'follow.created',
					new FollowCreatedEvent(followRecord!),
				);
			}

			return { status: FollowStatus.ACTIVE };
		}
	}

	async getFollower(
		viewerId: string,
		userId: string,
		query: FollowQueryRequestDto,
	) {
		await this.assertCanViewFollowList(viewerId, userId);

		const blockedUserIds = await this.blockService.getBlockedUserIds(viewerId);

		const result = await this.followRepository.getFollower(
			userId,
			query,
			blockedUserIds,
		);

		const items = result.data.map((follow) =>
			this.toDetailViewForViewer(follow, 'follower'),
		);

		return {
			items,
			nextCursor: result.nextCursor,
			hasNext: result.hasNext,
			limit: result.limit,
		};
	}

	async getFollowing(
		viewerId: string,
		userId: string,
		query: FollowQueryRequestDto,
	) {
		await this.assertCanViewFollowList(viewerId, userId);

		const blockedUserIds = await this.blockService.getBlockedUserIds(viewerId);

		const result = await this.followRepository.getFollowing(
			userId,
			query,
			blockedUserIds,
		);

		const items = result.data.map((follow) =>
			this.toDetailViewForViewer(follow, 'following'),
		);

		return {
			items,
			nextCursor: result.nextCursor,
			hasNext: result.hasNext,
			limit: result.limit,
		};
	}

	async unFollow(viewerId: string, userId: string) {
		const existing = await this.followRepository.findActiveFollow(
			viewerId,
			userId,
		);

		if (!existing) throw new HttpNotFoundError(ErrorCode.FOLLOW_NOT_FOUND);

		await this.followRepository.executeInTransaction(async (manager) => {
			await manager.update(Follow, existing.id, {
				status: FollowStatus.REMOVED,
			});

			if (existing.followeeOrgId && existing.status === FollowStatus.ACTIVE) {
				await this.decrementOrgFollowerCount(existing.followeeOrgId, manager);
			}
		});

		// `existing` is a pre-update snapshot (status still ACTIVE). This is
		// intentional: current listeners (FeedListener) only read followerId,
		// which is immutable. Any future listener that reads `follow.status`
		// must reload the entity from the DB rather than using event.follow.
		this.eventEmitter.emit('follow.removed', new FollowRemovedEvent(existing));

		return { status: FollowStatus.REMOVED };
	}

	async acceptFollowRequest(currentUserId: string, followId: string) {
		const follow = await this.followRepository.findById(followId);

		if (!follow) throw new HttpNotFoundError(ErrorCode.FOLLOW_NOT_FOUND);

		if (follow.followeeUserId !== currentUserId)
			throw new HttpForbiddenError(ErrorCode.USER_NOT_FOUND);

		if (follow.status === FollowStatus.ACTIVE)
			throw new HttpConflictError(ErrorCode.FOLLOW_ALREADY_ACTIVE);

		if (follow.status === FollowStatus.REMOVED)
			throw new HttpNotFoundError(ErrorCode.FOLLOW_NOT_FOUND);

		if (follow.status !== FollowStatus.PENDING)
			throw new HttpBadRequestError(ErrorCode.FOLLOW_NOT_PENDING);

		await this.followRepository.update(follow.id, {
			status: FollowStatus.ACTIVE,
		});
		return { status: FollowStatus.ACTIVE };
	}

	private async decrementOrgFollowerCount(
		orgId: string,
		manager: EntityManager,
	) {
		await manager
			.createQueryBuilder()
			.update(Organization)
			.set({
				followerCount: () => 'GREATEST(0, follower_count - 1)',
			})
			.where('id = :orgId', { orgId })
			.execute();
	}

	private toDetailViewForViewer(
		follow: Follow,
		mode: 'follower' | 'following',
	): FollowItemResponseDto {
		if (mode === 'follower') {
			const follower = follow.follower;
			return {
				followId: follow.id,
				id: follower.id,
				type: 'user',
				displayName: follower.profile?.displayName || follower.username,
				username: follower.username,
				avatarUrl: follower.profile?.avatarMedia?.cdnUrl || null,
				bio: follower.profile?.bio || null,
			};
		} else {
			if (follow.followeeUser) {
				const user = follow.followeeUser;
				return {
					followId: follow.id,
					id: user.id,
					type: 'user',
					displayName: user.profile?.displayName || user.username,
					username: user.username,
					avatarUrl: user.profile?.avatarMedia?.cdnUrl || null,
					bio: user.profile?.bio || null,
				};
			} else {
				const org = follow.followeeOrg!;
				return {
					followId: follow.id,
					id: org.id,
					type: 'organization',
					displayName: org.name,
					username: org.slug,
					avatarUrl: org.logoMedia?.cdnUrl || null,
					bio: org.description || null,
				};
			}
		}
	}

	private async assertCanViewFollowList(viewerId: string, targetId: string) {
		if (viewerId === targetId) return;
		const isBlocked = await this.blockService.isEitherBlocked(
			viewerId,
			targetId,
		);

		if (isBlocked) throw new HttpNotFoundError(ErrorCode.FOLLOWEE_NOT_FOUND);

		const targetProfile = await this.profileRepository.findOne({
			userId: targetId,
		});

		if (targetProfile?.isPrivate) {
			const isFollowing = await this.followRepository.findExistingRow(
				viewerId,
				{ followeeUserId: targetId },
			);

			if (!isFollowing || isFollowing.status !== FollowStatus.ACTIVE) {
				throw new HttpForbiddenError(ErrorCode.USER_NOT_FOUND);
			}
		}
	}

	private async incrementOrgFollowerCount(
		orgId: string,
		manager: EntityManager,
	): Promise<void> {
		await manager
			.createQueryBuilder()
			.update(Organization)
			.set({ followerCount: () => 'follower_count + 1' })
			.where('id = :orgId', { orgId })
			.execute();
	}
}
