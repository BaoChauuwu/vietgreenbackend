import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentReactionToNotifType1782200000000
	implements MigrationInterface
{
	name = 'AddCommentReactionToNotifType1782200000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// PostgreSQL 12+: ALTER TYPE … ADD VALUE can run inside a transaction;
		// IF NOT EXISTS makes it idempotent (safe to re-run).
		await queryRunner.query(
			`ALTER TYPE notification.notif_type ADD VALUE IF NOT EXISTS 'comment_reaction' AFTER 'post_reaction'`,
		);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {
		// PostgreSQL has no native DROP VALUE for enum types.
		// To roll back: recreate the enum without 'comment_reaction' and re-cast
		// the column — expensive on a live table. Accept forward-only for this value.
	}
}
