import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoMediaIdsToReviews1783000000000
	implements MigrationInterface
{
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE agriculture.product_reviews
      ADD COLUMN IF NOT EXISTS photo_media_ids uuid[] NOT NULL DEFAULT '{}';
    `);
		await queryRunner.query(`
      ALTER TABLE agriculture.supplier_reviews
      ADD COLUMN IF NOT EXISTS photo_media_ids uuid[] NOT NULL DEFAULT '{}';
    `);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE agriculture.product_reviews DROP COLUMN IF EXISTS photo_media_ids;
    `);
		await queryRunner.query(`
      ALTER TABLE agriculture.supplier_reviews DROP COLUMN IF EXISTS photo_media_ids;
    `);
	}
}
