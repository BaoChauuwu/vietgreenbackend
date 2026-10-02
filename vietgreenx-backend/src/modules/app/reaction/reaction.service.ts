import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { ReactionRequestDto } from './dto/requests/reaction.request.dto';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { PostService } from '@app/modules/app/post/post.service';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { ErrorCode, HttpNotFoundError } from '@app/common/errors';
import { ReactionCreatedEvent } from './events/reaction-created.event';
import { ReactionRemovedEvent } from './events/reaction-removed.event';
import { ReactionUpdatedEvent } from './events/reaction-updated.event';

@Injectable()
export class ReactionService {
	constructor(
		private readonly reactionRepo: ReactionRepository,
		private readonly postService: PostService,
		private readonly commentRepo: CommentRepository,
		private readonly eventEmitter: EventEmitter2,
		@InjectDataSource() private readonly dataSource: DataSource,
	) {}

	async react(user: User, dto: ReactionRequestDto) {
		if (dto.targetType === ReactionTargetType.POST) {
			await this.postService.findOne(dto.targetId, user.id);
		} else if (dto.targetType === ReactionTargetType.COMMENT) {
			const comment = await this.commentRepo.findById(dto.targetId);
			if (!comment) {
				throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
			}
			await this.postService.findOne(comment.postId, user.id);
		}

		// Atomic upsert: INSERT ... ON CONFLICT DO UPDATE.
		// xmax = 0 means the row was freshly inserted (no prior transaction holds it).
		// This is the PostgreSQL-native way to distinguish INSERT from UPDATE in a
		// single round-trip, eliminating the non-atomic findOne-before-upsert pattern
		// that could emit duplicate reaction.created events under concurrent requests.
		const [result]: [{ is_new_insert: boolean }] = await this.dataSource.query(
			`INSERT INTO engagement.reactions (id, user_id, target_id, target_type, reaction, created_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
			 ON CONFLICT ON CONSTRAINT uq_reaction
			 DO UPDATE SET reaction = EXCLUDED.reaction
			 RETURNING (xmax = 0) AS is_new_insert`,
			[user.id, dto.targetId, dto.targetType, dto.reaction],
		);

		const saved = await this.reactionRepo.findOne({
			userId: user.id,
			targetId: dto.targetId,
			targetType: dto.targetType,
		});

		if (!saved) {
			throw new HttpNotFoundError(ErrorCode.REACTION_NOT_FOUND);
		}

		if (result.is_new_insert) {
			this.eventEmitter.emit(
				'reaction.created',
				new ReactionCreatedEvent(
					user.id,
					dto.targetId,
					dto.targetType,
					dto.reaction,
				),
			);
		} else {
			this.eventEmitter.emit(
				'reaction.updated',
				new ReactionUpdatedEvent(
					user.id,
					dto.targetId,
					dto.targetType,
					dto.reaction,
				),
			);
		}

		return saved;
	}

	async listReactions(
		targetType: ReactionTargetType,
		targetId: string,
		reaction:
			| import('@app/common/enums/reaction-type.enum').ReactionType
			| undefined,
		page: number,
		limit: number,
	) {
		const { items, total } = await this.reactionRepo.listForTarget(
			targetType,
			targetId,
			reaction,
			page,
			limit,
		);
		return {
			items,
			total,
			page,
			limit,
			totalPage: Math.ceil(total / limit),
		};
	}

	async unreact(user: User, targetId: string, targetType: ReactionTargetType) {
		if (targetType === ReactionTargetType.POST) {
			await this.postService.findOne(targetId, user.id);
		} else if (targetType === ReactionTargetType.COMMENT) {
			const comment = await this.commentRepo.findById(targetId);
			if (!comment) {
				throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
			}
			await this.postService.findOne(comment.postId, user.id);
		}

		const reaction = await this.reactionRepo.findOne({
			userId: user.id,
			targetId,
			targetType,
		});

		if (reaction) {
			await this.reactionRepo.delete(reaction.id);
			this.eventEmitter.emit(
				'reaction.removed',
				new ReactionRemovedEvent(user.id, targetId, targetType),
			);
		}
	}
}
