import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignupChannelToUsers1780285800000
	implements MigrationInterface
{
	name = 'AddSignupChannelToUsers1780285800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE identity.users ADD COLUMN signup_channel TEXT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE identity.users ADD CONSTRAINT users_signup_channel_check CHECK (signup_channel IS NULL OR signup_channel IN ('phone', 'email'))`,
		);

		await queryRunner.query(`
			UPDATE identity.users
			SET signup_channel = 'phone'
			WHERE signup_channel IS NULL
			  AND phone IS NOT NULL
			  AND email IS NULL
		`);

		await queryRunner.query(`
			UPDATE identity.users
			SET signup_channel = 'email'
			WHERE signup_channel IS NULL
			  AND email IS NOT NULL
			  AND phone IS NULL
		`);

		await queryRunner.query(`
			UPDATE identity.users
			SET signup_channel = CASE
				WHEN phone_verified AND NOT COALESCE(email_verified, false) THEN 'phone'
				WHEN email_verified AND NOT COALESCE(phone_verified, false) THEN 'email'
				WHEN phone IS NOT NULL THEN 'phone'
				ELSE 'email'
			END
			WHERE signup_channel IS NULL
			  AND phone IS NOT NULL
			  AND email IS NOT NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS users_signup_channel_check`,
		);
		await queryRunner.query(
			`ALTER TABLE identity.users DROP COLUMN IF EXISTS signup_channel`,
		);
	}
}
