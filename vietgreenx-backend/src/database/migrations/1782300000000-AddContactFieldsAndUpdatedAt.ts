import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactFieldsAndUpdatedAt1782300000000
	implements MigrationInterface
{
	name = 'AddContactFieldsAndUpdatedAt1782300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE agriculture.green_profiles
				ADD COLUMN IF NOT EXISTS phone text,
				ADD COLUMN IF NOT EXISTS website text,
				ADD COLUMN IF NOT EXISTS email text
		`);

		await queryRunner.query(`
			ALTER TABLE agriculture.public_trace_tokens
				ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE agriculture.public_trace_tokens
				DROP COLUMN IF EXISTS updated_at
		`);

		await queryRunner.query(`
			ALTER TABLE agriculture.green_profiles
				DROP COLUMN IF EXISTS phone,
				DROP COLUMN IF EXISTS website,
				DROP COLUMN IF EXISTS email
		`);
	}
}
