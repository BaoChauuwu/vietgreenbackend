import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMembershipTiersTable1785727785912 implements MigrationInterface {
    name = 'CreateMembershipTiersTable1785727785912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system"."membership_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan" text NOT NULL, "display_name" text NOT NULL, "description" text, "price_monthly" numeric(12,0) NOT NULL, "price_yearly" numeric(12,0), "qr_limit" integer NOT NULL DEFAULT '0', "product_limit" integer NOT NULL DEFAULT '5', "trade_post_allowed" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "sort_order" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_aacca3faaf89f3e78e7bd1e4a15" UNIQUE ("plan"), CONSTRAINT "PK_a0179193618912cc1ad6d3c2553" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "identity"."profiles" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "identity"."organizations" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "agriculture"."green_profiles" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "moderation"."audit_logs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "moderation"."audit_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7()`);
        await queryRunner.query(`ALTER TABLE "analytics"."user_activity_logs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "analytics"."user_activity_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7()`);
        await queryRunner.query(`ALTER TABLE "agriculture"."public_trace_tokens" ALTER COLUMN "token" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "agriculture"."public_trace_tokens" ALTER COLUMN "token" SET DEFAULT uuid_generate_v7()`);
        await queryRunner.query(`ALTER TABLE "agriculture"."qr_scans" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "agriculture"."qr_scans" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agriculture"."qr_scans" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "agriculture"."qr_scans" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "agriculture"."public_trace_tokens" ALTER COLUMN "token" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "agriculture"."public_trace_tokens" ALTER COLUMN "token" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "analytics"."user_activity_logs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "analytics"."user_activity_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "moderation"."audit_logs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "moderation"."audit_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "agriculture"."green_profiles" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "identity"."organizations" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "identity"."profiles" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`DROP TABLE "system"."membership_tiers"`);
    }

}
