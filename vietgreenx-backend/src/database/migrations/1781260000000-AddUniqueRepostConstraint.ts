import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueRepostConstraint1781260000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE UNIQUE INDEX IF NOT EXISTS uq_shares_repost
			ON engagement.shares (user_id, post_id)
			WHERE share_type = 'repost'
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DROP INDEX IF EXISTS engagement.uq_shares_repost
		`);
	}
}
