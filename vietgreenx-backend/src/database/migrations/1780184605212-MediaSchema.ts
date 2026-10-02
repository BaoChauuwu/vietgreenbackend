import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaSchema1780184605212 implements MigrationInterface {
	name = 'MediaSchema1780184605212';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE media.media (
                id                UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                uploader_id       UUID        NOT NULL,
                media_type        TEXT        NOT NULL
                                  CHECK (media_type IN ('image', 'video', 'document', 'audio')),
                storage_key       TEXT        NOT NULL UNIQUE,
                cdn_url           TEXT        NOT NULL,
                thumbnail_url     TEXT,
                file_size_bytes   BIGINT      NOT NULL CHECK (file_size_bytes > 0),
                mime_type         TEXT        NOT NULL,
                width_px          INTEGER,
                height_px         INTEGER,
                duration_sec      NUMERIC(8,2),
                alt_text          TEXT,
                processing_status TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (processing_status IN ('pending','processing','ready','failed')),
                created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at        TIMESTAMPTZ,
                CONSTRAINT fk_media_uploader FOREIGN KEY (uploader_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_media_uploader     ON media.media (uploader_id) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_media_type         ON media.media (media_type)  WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_media_created_brin ON media.media USING BRIN (created_at)`,
		);

		await queryRunner.query(`
            ALTER TABLE identity.profiles
                ADD CONSTRAINT fk_profile_avatar FOREIGN KEY (avatar_media_id)
                    REFERENCES media.media(id) ON DELETE SET NULL,
                ADD CONSTRAINT fk_profile_cover  FOREIGN KEY (cover_media_id)
                    REFERENCES media.media(id) ON DELETE SET NULL
        `);
		await queryRunner.query(`
            ALTER TABLE identity.organizations
                ADD CONSTRAINT fk_org_logo  FOREIGN KEY (logo_media_id)
                    REFERENCES media.media(id) ON DELETE SET NULL,
                ADD CONSTRAINT fk_org_cover FOREIGN KEY (cover_media_id)
                    REFERENCES media.media(id) ON DELETE SET NULL
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE identity.organizations DROP CONSTRAINT IF EXISTS fk_org_cover`,
		);
		await queryRunner.query(
			`ALTER TABLE identity.organizations DROP CONSTRAINT IF EXISTS fk_org_logo`,
		);
		await queryRunner.query(
			`ALTER TABLE identity.profiles DROP CONSTRAINT IF EXISTS fk_profile_cover`,
		);
		await queryRunner.query(
			`ALTER TABLE identity.profiles DROP CONSTRAINT IF EXISTS fk_profile_avatar`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS media.media`);
	}
}
