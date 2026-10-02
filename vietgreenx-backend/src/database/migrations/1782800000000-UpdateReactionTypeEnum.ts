import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReactionTypeEnum1782800000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add green value first (cannot remove values from enum directly in Postgres)
		await queryRunner.query(
			`ALTER TYPE engagement.reaction_type ADD VALUE IF NOT EXISTS 'green'`,
		);

		// Commit the ADD VALUE before we can use it in subsequent statements
		await queryRunner.commitTransaction();
		await queryRunner.startTransaction();

		// Migrate existing thank_you reactions to helpful
		await queryRunner.query(`
			UPDATE engagement.reactions
			SET reaction = 'helpful'::engagement.reaction_type
			WHERE reaction = 'thank_you'::engagement.reaction_type
		`);

		// Recreate enum without thank_you
		await queryRunner.query(
			`ALTER TYPE engagement.reaction_type RENAME TO reaction_type_old`,
		);
		await queryRunner.query(
			`CREATE TYPE engagement.reaction_type AS ENUM ('like', 'love', 'helpful', 'trust', 'green')`,
		);
		await queryRunner.query(`
			ALTER TABLE engagement.reactions
			ALTER COLUMN reaction TYPE engagement.reaction_type
			USING reaction::text::engagement.reaction_type
		`);
		await queryRunner.query(`DROP TYPE engagement.reaction_type_old`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE engagement.reaction_type RENAME TO reaction_type_old`,
		);
		await queryRunner.query(
			`CREATE TYPE engagement.reaction_type AS ENUM ('like', 'love', 'helpful', 'trust', 'thank_you')`,
		);
		await queryRunner.query(`
			UPDATE engagement.reactions SET reaction = 'thank_you'::engagement.reaction_type WHERE reaction = 'green'::engagement.reaction_type
		`);
		await queryRunner.query(`
			ALTER TABLE engagement.reactions
			ALTER COLUMN reaction TYPE engagement.reaction_type
			USING reaction::text::engagement.reaction_type
		`);
		await queryRunner.query(`DROP TYPE engagement.reaction_type_old`);
	}
}
