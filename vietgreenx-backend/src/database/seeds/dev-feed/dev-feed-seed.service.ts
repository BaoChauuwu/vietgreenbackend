import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { PostMedia } from '@app/database/typeorm/entities/content/post-media.entity';
import { PostTag } from '@app/database/typeorm/entities/content/post-tag.entity';
import { PostHashtag } from '@app/database/typeorm/entities/content/post-hashtag.entity';
import { Hashtag } from '@app/database/typeorm/entities/content/hashtag.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { SignupChannel } from '@app/common/enums/signup-channel.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { FollowStatus } from '@app/common/enums/follow-status.enum';
import {
	buildDevFeedPostSeeds,
	DEV_FEED_PASSWORD,
	DEV_FEED_POSTS_PER_USER,
	DEV_FEED_USERS,
	DevFeedUserSeed,
} from '@app/database/data/dev-feed.seed-data';
import {
	normalizeHashtagToken,
	parseHashtagsFromBody,
} from '@app/modules/app/post/utils/parse-post-hashtags';

@Injectable()
export class DevFeedSeedService {
	constructor(
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(Category)
		private readonly categoryRepo: Repository<Category>,
		@InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
	) {}

	async run(): Promise<void> {
		const categories = await this.categoryRepo.find({
			where: { isActive: true },
			order: { sortOrder: 'ASC' },
			take: 5,
		});

		if (categories.length === 0) {
			throw new Error(
				'No agriculture categories found. Run migrations first (SeedData).',
			);
		}

		const categoryRefs = categories.map((category) => ({
			id: category.id,
			nameVi: category.nameVi,
		}));
		const seededUsers: Array<{ user: User; seed: DevFeedUserSeed }> = [];

		for (const seed of DEV_FEED_USERS) {
			const user = await this.ensureUser(seed);
			await this.ensureProfile(user.id, seed);
			await this.ensurePosts(user, seed, categoryRefs);
			seededUsers.push({ user, seed });
		}

		await this.ensureFollowGraph(seededUsers.map((entry) => entry.user));

		this.printSummary(seededUsers);
	}

	private async ensureUser(seed: DevFeedUserSeed): Promise<User> {
		const existing = await this.userRepo.findOne({
			where: { username: seed.username },
		});
		if (existing) {
			return existing;
		}

		const passwordHash = await bcrypt.hash(DEV_FEED_PASSWORD, 10);
		return this.userRepo.save(
			this.userRepo.create({
				username: seed.username,
				email: seed.email,
				phone: seed.phone,
				passwordHash,
				role: seed.role,
				status: UserStatus.ACTIVE,
				verificationLevel: VerificationLevel.UNVERIFIED,
				emailVerified: true,
				phoneVerified: true,
				authProvider: 'local',
				signupChannel: SignupChannel.PHONE,
			}),
		);
	}

	private async ensureProfile(
		userId: string,
		seed: DevFeedUserSeed,
	): Promise<void> {
		await this.profileRepo.update(
			{ userId },
			{
				displayName: seed.displayName,
				province: seed.province,
				bio: `Local seed account for role ${seed.role}`,
			},
		);
	}

	private async ensurePosts(
		user: User,
		seed: DevFeedUserSeed,
		categoryRefs: Array<{ id: string; nameVi: string }>,
	): Promise<void> {
		const existingCount = await this.postRepo.count({
			where: { authorId: user.id, isDraft: false },
		});

		if (existingCount >= DEV_FEED_POSTS_PER_USER) {
			console.log(
				`⏭️  ${seed.username}: already has ${existingCount} posts, skipping`,
			);
			return;
		}

		const postsToCreate = DEV_FEED_POSTS_PER_USER - existingCount;
		const templates = buildDevFeedPostSeeds(
			seed.role,
			seed.province,
			categoryRefs,
		);
		const globalOffset = await this.postRepo.count();

		await this.postRepo.manager.transaction(async (manager) => {
			for (let index = 0; index < postsToCreate; index += 1) {
				const template = templates[(existingCount + index) % templates.length];
				const createdAt = this.buildCreatedAt(
					globalOffset + existingCount + index,
				);

				await this.createPost(manager, user.id, template, createdAt, index);
			}
		});

		console.log(`✅ ${seed.username}: created ${postsToCreate} posts`);
	}

	private buildCreatedAt(offsetFromNewest: number): Date {
		const minutesAgo = (offsetFromNewest + 1) * 2;
		return new Date(Date.now() - minutesAgo * 60_000);
	}

	private async createPost(
		manager: EntityManager,
		authorId: string,
		template: ReturnType<typeof buildDevFeedPostSeeds>[number],
		createdAt: Date,
		mediaSeed: number,
	): Promise<void> {
		const post = await manager.getRepository(Post).save(
			manager.getRepository(Post).create({
				authorId,
				body: template.body,
				category: template.category ?? null,
				visibility: template.visibility ?? VisibilityType.PUBLIC,
				isDraft: false,
				sourceMetadata: { seed: 'dev-feed' },
				createdAt,
				updatedAt: createdAt,
			}),
		);

		const mediaIds = await this.createMediaForPost(
			manager,
			authorId,
			post.id,
			template.mediaCount,
			mediaSeed,
		);

		if (mediaIds.length > 0) {
			await manager.getRepository(PostMedia).save(
				mediaIds.map((mediaId, position) =>
					manager.getRepository(PostMedia).create({
						postId: post.id,
						mediaId,
						position,
					}),
				),
			);
		}

		if (template.tags.length > 0) {
			await manager.getRepository(PostTag).save(
				template.tags.map((tag) =>
					manager.getRepository(PostTag).create({
						postId: post.id,
						tagType: tag.tagType,
						refId: tag.refId ?? null,
						refLabel: tag.refLabel,
					}),
				),
			);
		}

		await this.syncHashtags(manager, post.id, template.body);
	}

	private async createMediaForPost(
		manager: EntityManager,
		authorId: string,
		postId: string,
		count: number,
		seed: number,
	): Promise<string[]> {
		if (count <= 0) {
			return [];
		}

		const mediaRepo = manager.getRepository(Media);
		const ids: string[] = [];

		for (let index = 0; index < count; index += 1) {
			const imageSeed = `${postId}-${seed}-${index}`;
			const media = await mediaRepo.save(
				mediaRepo.create({
					uploaderId: authorId,
					mediaType: 'image',
					storageKey: `dev-feed/${authorId}/${postId}/${index}.jpg`,
					cdnUrl: `https://picsum.photos/seed/${imageSeed}/800/600`,
					thumbnailUrl: `https://picsum.photos/seed/${imageSeed}/320/240`,
					fileSizeBytes: 250_000 + index * 10_000,
					mimeType: 'image/jpeg',
					widthPx: 800,
					heightPx: 600,
					altText: `Dev feed seed image ${index + 1}`,
					processingStatus: 'ready',
				}),
			);
			ids.push(media.id);
		}

		return ids;
	}

	private async syncHashtags(
		manager: EntityManager,
		postId: string,
		body: string | null | undefined,
	): Promise<void> {
		const tags = parseHashtagsFromBody(body);
		if (tags.length === 0) {
			return;
		}

		const hashtagRepo = manager.getRepository(Hashtag);
		const postHashtagRepo = manager.getRepository(PostHashtag);
		const hashtagIds: string[] = [];

		for (const tag of tags) {
			const normalized = normalizeHashtagToken(tag);
			let hashtag = await hashtagRepo.findOne({ where: { tag: normalized } });
			if (!hashtag) {
				hashtag = await hashtagRepo.save(
					hashtagRepo.create({ tag: normalized, postCount: 0 }),
				);
			}

			await postHashtagRepo.save({ postId, hashtagId: hashtag.id });
			hashtagIds.push(hashtag.id);
		}

		if (hashtagIds.length > 0) {
			await hashtagRepo
				.createQueryBuilder()
				.update(Hashtag)
				.set({ postCount: () => 'post_count + 1' })
				.where('id IN (:...ids)', { ids: [...new Set(hashtagIds)] })
				.execute();
		}
	}

	private async ensureFollowGraph(users: User[]): Promise<void> {
		const consumer = users.find((user) => user.username === 'feed_consumer');
		if (!consumer) {
			return;
		}

		const others = users.filter((user) => user.id !== consumer.id);
		let created = 0;

		for (const followee of others) {
			const exists = await this.followRepo.findOne({
				where: {
					followerId: consumer.id,
					followeeUserId: followee.id,
					followeeOrgId: IsNull(),
				},
			});

			if (exists) {
				continue;
			}

			await this.followRepo.save(
				this.followRepo.create({
					followerId: consumer.id,
					followeeUserId: followee.id,
					followeeOrgId: null,
					status: FollowStatus.ACTIVE,
				}),
			);
			created += 1;
		}

		if (created > 0) {
			console.log(`✅ feed_consumer now follows ${created} seed accounts`);
		}
	}

	private printSummary(
		seededUsers: Array<{ user: User; seed: DevFeedUserSeed }>,
	): void {
		console.log('\n📋 Dev feed accounts (password for all: 123qwe!@#)');
		console.log('─'.repeat(72));
		for (const { seed } of seededUsers) {
			console.log(
				`${seed.role.padEnd(12)} | login: ${seed.phone} or ${seed.email} | @${seed.username}`,
			);
		}
		console.log('─'.repeat(72));
		console.log('Feed tips:');
		console.log('- Discovery: GET /api/app/feed?mode=discovery&limit=10');
		console.log(
			'- Following: login feed_consumer, GET /api/app/feed?mode=following',
		);
		console.log('- Cursor: use nextCursor from response for page 2+\n');
	}
}
