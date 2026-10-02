import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaModeration1782400000000 implements MigrationInterface {
	async up(q: QueryRunner): Promise<void> {
		await q.query(`CREATE SCHEMA IF NOT EXISTS moderation`);
		await q.query(`
      CREATE TABLE moderation.media_hashes (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        media_id    uuid NOT NULL UNIQUE REFERENCES media.media(id) ON DELETE CASCADE,
        owner_id    uuid NOT NULL,
        phash       bigint NOT NULL,
        dhash       bigint NOT NULL,
        purpose     text   NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_media_hashes_owner   ON moderation.media_hashes (owner_id);
      CREATE INDEX idx_media_hashes_purpose ON moderation.media_hashes (purpose);

      CREATE TABLE moderation.media_moderation_flags (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        media_id         uuid NOT NULL UNIQUE REFERENCES media.media(id) ON DELETE CASCADE,
        owner_id         uuid NOT NULL,
        verdict          text NOT NULL,
        exif_suspicious  boolean NOT NULL DEFAULT false,
        matched_media_id uuid NULL,
        matched_owner_id uuid NULL,
        distance         int  NULL,
        details          jsonb NULL,
        status           text NOT NULL DEFAULT 'pending',
        reviewed_by      uuid NULL,
        reviewed_at      timestamptz NULL,
        created_at       timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_mmf_media_id ON moderation.media_moderation_flags (media_id);
      CREATE INDEX idx_mmf_status   ON moderation.media_moderation_flags (status);
      CREATE INDEX idx_mmf_verdict  ON moderation.media_moderation_flags (verdict);
    `);
	}

	async down(q: QueryRunner): Promise<void> {
		await q.query(`
      DROP TABLE IF EXISTS moderation.media_moderation_flags;
      DROP TABLE IF EXISTS moderation.media_hashes;
    `);
	}
}
