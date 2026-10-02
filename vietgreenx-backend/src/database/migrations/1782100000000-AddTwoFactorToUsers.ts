import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorToUsers1782100000000 implements MigrationInterface {
	name = 'AddTwoFactorToUsers1782100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE identity.users
                ADD COLUMN two_factor_secret TEXT NULL,
                ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                ADD COLUMN two_factor_backup_codes TEXT[] NULL
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE identity.users
                DROP COLUMN IF EXISTS two_factor_backup_codes,
                DROP COLUMN IF EXISTS two_factor_enabled,
                DROP COLUMN IF EXISTS two_factor_secret
        `);
	}
}
