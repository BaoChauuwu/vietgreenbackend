import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLengthConstraintToCommentBody1781074663378
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			DROP CONSTRAINT IF EXISTS comments_body_check;
		`);
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			ADD CONSTRAINT comments_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 500);
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			DROP CONSTRAINT IF EXISTS comments_body_check;
		`);
		await queryRunner.query(`
			ALTER TABLE engagement.comments
			ADD CONSTRAINT comments_body_check CHECK (char_length(body) >= 1);
		`);
	}
}
