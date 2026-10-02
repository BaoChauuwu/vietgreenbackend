import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCropSeasonStatusAndArea1781250000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.commitTransaction();
		await queryRunner.query(
			`ALTER TYPE agriculture.season_status ADD VALUE IF NOT EXISTS 'planning'`,
		);
		await queryRunner.startTransaction();

		await queryRunner.query(
			`ALTER TABLE agriculture.crop_seasons ALTER COLUMN status SET DEFAULT 'planning'`,
		);

		await queryRunner.query(
			`UPDATE agriculture.crop_seasons SET area_ha = 0 WHERE area_ha IS NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE agriculture.crop_seasons ALTER COLUMN area_ha SET NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE agriculture.crop_seasons ALTER COLUMN area_ha DROP NOT NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE agriculture.crop_seasons ALTER COLUMN status SET DEFAULT 'active'`,
		);
	}
}
