import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Block } from '../entities/social-graph/block.entity';

@Injectable()
export class BlockRepository extends BaseRepository<Block> {
	constructor(
		@InjectRepository(Block)
		private readonly blockRepo: Repository<Block>,
	) {
		super(blockRepo);
	}

	async findMutuallyBlockedUserIds(userId: string): Promise<string[]> {
		const rows = await this.createQueryBuilder('block')
			.select(['block.blockerId', 'block.blockedId'])
			.where('block.blockerId = :userId OR block.blockedId = :userId', {
				userId,
			})
			.getMany();

		const ids = new Set<string>();
		for (const row of rows) {
			ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
		}
		return [...ids];
	}

	async existsEitherDirection(
		userIdA: string,
		userIdB: string,
	): Promise<boolean> {
		const count = await this.createQueryBuilder('block')
			.where(
				'(block.blockerId = :userIdA AND block.blockedId = :userIdB) OR (block.blockerId = :userIdB AND block.blockedId = :userIdA)',
				{ userIdA, userIdB },
			)
			.getCount();
		return count > 0;
	}

	async findByBlockerAndBlocked(
		blockerId: string,
		blockedId: string,
	): Promise<Block | null> {
		return this.findOne({ blockerId, blockedId });
	}
}
