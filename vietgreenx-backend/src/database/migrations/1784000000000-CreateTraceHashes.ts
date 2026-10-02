import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTraceHashes1784000000000 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agriculture.trace_hashes (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type   TEXT NOT NULL,
        entity_id     UUID NOT NULL,
        hash          TEXT NOT NULL,
        prev_hash     TEXT,
        chain_index   BIGINT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_trace_hash_entity
        ON agriculture.trace_hashes (entity_type, entity_id);
    `);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      DROP TABLE IF EXISTS agriculture.trace_hashes;
    `);
	}
}
