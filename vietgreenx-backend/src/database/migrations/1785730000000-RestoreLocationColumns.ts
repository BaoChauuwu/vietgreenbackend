import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreLocationColumns1785730000000 implements MigrationInterface {
	name = 'RestoreLocationColumns1785730000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "agriculture"."green_profiles" ADD COLUMN IF NOT EXISTS "location" geography(Point,4326)`,
		);
		await queryRunner.query(
			`ALTER TABLE "identity"."organizations" ADD COLUMN IF NOT EXISTS "location" geography(Point,4326)`,
		);
		await queryRunner.query(
			`ALTER TABLE "identity"."profiles" ADD COLUMN IF NOT EXISTS "location" geography(Point,4326)`,
		);

		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "idx_gp_location" ON "agriculture"."green_profiles" USING GIST ("location")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "idx_org_location" ON "identity"."organizations" USING GIST ("location")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "idx_profiles_location" ON "identity"."profiles" USING GIST ("location")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "identity"."idx_profiles_location"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "identity"."idx_org_location"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "agriculture"."idx_gp_location"`);

		await queryRunner.query(
			`ALTER TABLE "identity"."profiles" DROP COLUMN IF EXISTS "location"`,
		);
		await queryRunner.query(
			`ALTER TABLE "identity"."organizations" DROP COLUMN IF EXISTS "location"`,
		);
		await queryRunner.query(
			`ALTER TABLE "agriculture"."green_profiles" DROP COLUMN IF EXISTS "location"`,
		);
	}
}
