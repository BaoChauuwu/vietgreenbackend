import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanToUsers1781500000000 implements MigrationInterface {
	name = 'AddPlanToUsers1781500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TYPE identity.membership_plan AS ENUM ('free', 'seller', 'cooperative_enterprise')
        `);

		await queryRunner.query(`
            ALTER TABLE identity.users
                ADD COLUMN plan identity.membership_plan NOT NULL DEFAULT 'free',
                ADD COLUMN plan_expires_at TIMESTAMPTZ NULL
        `);

		await queryRunner.query(`
            CREATE INDEX idx_users_plan ON identity.users (plan)
        `);

		await queryRunner.query(`
            CREATE INDEX idx_users_plan_expires ON identity.users (plan_expires_at)
            WHERE plan != 'free' AND plan_expires_at IS NOT NULL
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX IF EXISTS identity.idx_users_plan_expires`,
		);
		await queryRunner.query(`DROP INDEX IF EXISTS identity.idx_users_plan`);
		await queryRunner.query(`
            ALTER TABLE identity.users
                DROP COLUMN IF EXISTS plan_expires_at,
                DROP COLUMN IF EXISTS plan
        `);
		await queryRunner.query(`DROP TYPE IF EXISTS identity.membership_plan`);
	}
}
