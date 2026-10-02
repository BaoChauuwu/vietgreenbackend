import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepostSourceToPosts1780285700000 implements MigrationInterface {
	name = 'AddRepostSourceToPosts1780285700000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE content.posts DROP CONSTRAINT posts_source_check`,
		);
		await queryRunner.query(
			`ALTER TABLE content.posts ADD CONSTRAINT posts_source_check CHECK (source IS NULL OR source IN ('organic', 'vietshopx247', 'repost'))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE content.posts DROP CONSTRAINT posts_source_check`,
		);
		await queryRunner.query(
			`ALTER TABLE content.posts ADD CONSTRAINT posts_source_check CHECK (source IS NULL OR source IN ('organic', 'vietshopx247'))`,
		);
	}
}
