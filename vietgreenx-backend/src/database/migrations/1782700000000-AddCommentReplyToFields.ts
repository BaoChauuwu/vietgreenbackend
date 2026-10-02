import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentReplyToFields1782700000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			ADD COLUMN IF NOT EXISTS reply_to_comment_id uuid REFERENCES engagement.comments(id) ON DELETE SET NULL,
			ADD COLUMN IF NOT EXISTS reply_to_user_id uuid REFERENCES identity.users(id) ON DELETE SET NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			DROP COLUMN IF EXISTS reply_to_comment_id,
			DROP COLUMN IF EXISTS reply_to_user_id
		`);
	}
}
