import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentSchema1780184605548 implements MigrationInterface {
	name = 'ContentSchema1780184605548';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE content.posts (
                id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                author_id            UUID        NOT NULL,
                org_id               UUID,
                body                 TEXT        CHECK (char_length(body) <= 2000),
                visibility           content.visibility_type NOT NULL DEFAULT 'public',
                category             content.post_category,
                is_draft             BOOLEAN     NOT NULL DEFAULT FALSE,
                is_edited            BOOLEAN     NOT NULL DEFAULT FALSE,
                source               TEXT        CHECK (source IS NULL OR source IN ('organic', 'vietshopx247')),
                source_metadata      JSONB       NOT NULL DEFAULT '{}',
                external_url         TEXT,
                external_click_count INTEGER     NOT NULL DEFAULT 0 CHECK (external_click_count >= 0),
                reaction_count       INTEGER     NOT NULL DEFAULT 0 CHECK (reaction_count >= 0),
                comment_count        INTEGER     NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
                share_count          INTEGER     NOT NULL DEFAULT 0 CHECK (share_count >= 0),
                view_count           INTEGER     NOT NULL DEFAULT 0 CHECK (view_count >= 0),
                ranking_score        NUMERIC(12,4) NOT NULL DEFAULT 0,
                version              INTEGER     NOT NULL DEFAULT 0,
                created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at           TIMESTAMPTZ,
                CONSTRAINT fk_post_author FOREIGN KEY (author_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_post_org    FOREIGN KEY (org_id)
                    REFERENCES identity.organizations(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_posts_author       ON content.posts (author_id, created_at DESC) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_visibility   ON content.posts (visibility, created_at DESC) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_category     ON content.posts (category) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_source       ON content.posts (source) WHERE source IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_external_url ON content.posts (source, external_click_count DESC) WHERE source = 'vietshopx247' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_fts          ON content.posts USING GIN (to_tsvector('simple', coalesce(body, ''))) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_posts_brin         ON content.posts USING BRIN (created_at)`,
		);

		await queryRunner.query(`
            CREATE TABLE content.post_media (
                post_id  UUID     NOT NULL,
                media_id UUID     NOT NULL,
                position SMALLINT NOT NULL DEFAULT 0,
                PRIMARY KEY (post_id, media_id),
                CONSTRAINT fk_pm_post  FOREIGN KEY (post_id)
                    REFERENCES content.posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_pm_media FOREIGN KEY (media_id)
                    REFERENCES media.media(id) ON DELETE RESTRICT
            )
        `);

		await queryRunner.query(`
            CREATE TABLE content.hashtags (
                id         UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                tag        TEXT    NOT NULL UNIQUE,
                post_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_hashtag_tag ON content.hashtags (tag)`,
		);

		await queryRunner.query(`
            CREATE TABLE content.post_hashtags (
                post_id    UUID NOT NULL,
                hashtag_id UUID NOT NULL,
                PRIMARY KEY (post_id, hashtag_id),
                CONSTRAINT fk_ph_post    FOREIGN KEY (post_id)
                    REFERENCES content.posts(id)    ON DELETE CASCADE,
                CONSTRAINT fk_ph_hashtag FOREIGN KEY (hashtag_id)
                    REFERENCES content.hashtags(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_post_hashtags_tag ON content.post_hashtags (hashtag_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE content.post_tags (
                id        UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                post_id   UUID    NOT NULL,
                tag_type  TEXT    NOT NULL CHECK (tag_type IN ('product', 'region', 'category')),
                ref_id    UUID,
                ref_label TEXT    NOT NULL,
                CONSTRAINT fk_pt_post FOREIGN KEY (post_id)
                    REFERENCES content.posts(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_post_tags_post ON content.post_tags (post_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_post_tags_ref  ON content.post_tags (ref_id) WHERE ref_id IS NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS content.post_tags`);
		await queryRunner.query(`DROP TABLE IF EXISTS content.post_hashtags`);
		await queryRunner.query(`DROP TABLE IF EXISTS content.hashtags`);
		await queryRunner.query(`DROP TABLE IF EXISTS content.post_media`);
		await queryRunner.query(`DROP TABLE IF EXISTS content.posts`);
	}
}
