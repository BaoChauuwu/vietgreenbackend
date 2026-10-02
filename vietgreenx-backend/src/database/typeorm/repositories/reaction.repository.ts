import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Reaction } from '../entities';
import { ReactionType } from '@app/common/enums/reaction-type.enum';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';

type BreakdownRow = { reaction: ReactionType; count: string };

export type ReactionListRow = {
	userId: string;
	displayName: string;
	avatarUrl: string | null;
	reaction: ReactionType;
};

@Injectable()
export class ReactionRepository extends BaseRepository<Reaction> {
	constructor(
		@InjectRepository(Reaction)
		private readonly reactionRepo: Repository<Reaction>,
	) {
		super(reactionRepo);
	}

	async getBreakdownForTarget(
		targetType: ReactionTargetType,
		targetId: string,
	): Promise<Partial<Record<ReactionType, number>>> {
		const rows: BreakdownRow[] = await this.reactionRepo.query(
			`
			SELECT reaction, COUNT(*) AS count
			FROM engagement.reactions
			WHERE target_type = $1 AND target_id = $2
			GROUP BY reaction
			`,
			[targetType, targetId],
		);
		const breakdown: Partial<Record<ReactionType, number>> = {};
		for (const row of rows) {
			breakdown[row.reaction] = parseInt(row.count, 10);
		}
		return breakdown;
	}

	async listForTarget(
		targetType: ReactionTargetType,
		targetId: string,
		reaction: ReactionType | undefined,
		page: number,
		limit: number,
	): Promise<{ items: ReactionListRow[]; total: number }> {
		const params: unknown[] = [targetType, targetId];
		const reactionFilter = reaction
			? `AND r.reaction = $${params.push(reaction)}`
			: '';
		const offset = (page - 1) * limit;

		const rows: (ReactionListRow & { total: string })[] =
			await this.reactionRepo.query(
				`
			SELECT
				r.user_id        AS "userId",
				p.display_name   AS "displayName",
				m.cdn_url        AS "avatarUrl",
				r.reaction,
				COUNT(*) OVER()  AS total
			FROM engagement.reactions r
			JOIN identity.profiles p ON p.user_id = r.user_id
			LEFT JOIN media.media m ON m.id = p.avatar_media_id
			WHERE r.target_type = $1 AND r.target_id = $2 ${reactionFilter}
			ORDER BY r.created_at DESC
			LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}
			`,
				params,
			);

		return {
			items: rows.map(({ total: _t, ...rest }) => rest),
			total: rows.length > 0 ? parseInt(rows[0].total, 10) : 0,
		};
	}

	async getViewerReaction(
		targetType: ReactionTargetType,
		targetId: string,
		userId: string,
	): Promise<ReactionType | null> {
		const row = await this.reactionRepo.findOne({
			where: { targetType, targetId, userId },
			select: ['reaction'],
		});
		return row?.reaction ?? null;
	}
}
