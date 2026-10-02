import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressCodes1782500000000 implements MigrationInterface {
	async up(q: QueryRunner): Promise<void> {
		await q.query(`
			ALTER TABLE identity.profiles
				ADD COLUMN IF NOT EXISTS province_code int,
				ADD COLUMN IF NOT EXISTS district_code int,
				ADD COLUMN IF NOT EXISTS ward_code int;

			ALTER TABLE agriculture.green_profiles
				ADD COLUMN IF NOT EXISTS province_code int,
				ADD COLUMN IF NOT EXISTS district_code int,
				ADD COLUMN IF NOT EXISTS ward_code int;

			ALTER TABLE agriculture.trade_posts
				ADD COLUMN IF NOT EXISTS province_code int,
				ADD COLUMN IF NOT EXISTS district_code int,
				ADD COLUMN IF NOT EXISTS ward_code int;

			ALTER TABLE agriculture.products
				ADD COLUMN IF NOT EXISTS province_code int,
				ADD COLUMN IF NOT EXISTS district_code int,
				ADD COLUMN IF NOT EXISTS ward_code int;
		`);
	}

	async down(q: QueryRunner): Promise<void> {
		await q.query(`
			ALTER TABLE identity.profiles
				DROP COLUMN IF EXISTS province_code,
				DROP COLUMN IF EXISTS district_code,
				DROP COLUMN IF EXISTS ward_code;

			ALTER TABLE agriculture.green_profiles
				DROP COLUMN IF EXISTS province_code,
				DROP COLUMN IF EXISTS district_code,
				DROP COLUMN IF EXISTS ward_code;

			ALTER TABLE agriculture.trade_posts
				DROP COLUMN IF EXISTS province_code,
				DROP COLUMN IF EXISTS district_code,
				DROP COLUMN IF EXISTS ward_code;

			ALTER TABLE agriculture.products
				DROP COLUMN IF EXISTS province_code,
				DROP COLUMN IF EXISTS district_code,
				DROP COLUMN IF EXISTS ward_code;
		`);
	}
}
