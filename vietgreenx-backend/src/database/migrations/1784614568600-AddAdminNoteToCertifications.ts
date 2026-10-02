import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminNoteToCertifications1784614568600
	implements MigrationInterface
{
	name = 'AddAdminNoteToCertifications1784614568600';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "agriculture"."certifications"
			 ADD COLUMN IF NOT EXISTS "admin_note" text,
			 ADD COLUMN IF NOT EXISTS "reviewed_by" uuid,
			 ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP WITH TIME ZONE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "agriculture"."certifications"
			 DROP COLUMN IF EXISTS "reviewed_at",
			 DROP COLUMN IF EXISTS "reviewed_by",
			 DROP COLUMN IF EXISTS "admin_note"`,
		);
	}
}
