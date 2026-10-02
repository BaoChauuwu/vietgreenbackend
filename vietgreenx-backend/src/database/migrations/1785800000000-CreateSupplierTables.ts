import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSupplierTables1785800000000 implements MigrationInterface {
  name = "CreateSupplierTables1785800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agriculture"."saved_suppliers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_saved_supplier" UNIQUE ("user_id", "supplier_id"),
        CONSTRAINT "pk_saved_suppliers" PRIMARY KEY ("id"),
        CONSTRAINT "fk_saved_supplier_user" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_saved_supplier_target" FOREIGN KEY ("supplier_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_supplier_user" ON "agriculture"."saved_suppliers" ("user_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agriculture"."supplier_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reviewer_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "order_id" uuid,
        "rating" smallint NOT NULL,
        "review_body" text,
        "photo_media_ids" uuid[] NOT NULL DEFAULT '{}',
        "is_hidden" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_supplier_review" UNIQUE ("reviewer_id", "supplier_id"),
        CONSTRAINT "pk_supplier_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "fk_supplier_review_reviewer" FOREIGN KEY ("reviewer_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_supplier_review_supplier" FOREIGN KEY ("supplier_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_supplier_review_supplier" ON "agriculture"."supplier_reviews" ("supplier_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agriculture"."supplier_reviews";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agriculture"."saved_suppliers";`);
  }
}
