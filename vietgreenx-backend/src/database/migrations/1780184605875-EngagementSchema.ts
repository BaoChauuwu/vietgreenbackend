import { MigrationInterface, QueryRunner } from 'typeorm';

export class EngagementSchema1780184605875 implements MigrationInterface {
	name = 'EngagementSchema1780184605875';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE engagement.reactions (
                id          UUID                        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id     UUID                        NOT NULL,
                target_type TEXT                        NOT NULL CHECK (target_type IN ('post', 'comment')),
                target_id   UUID                        NOT NULL,
                reaction    engagement.reaction_type    NOT NULL,
                created_at  TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_reaction UNIQUE (user_id, target_type, target_id),
                CONSTRAINT fk_reaction_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_reactions_target ON engagement.reactions (target_type, target_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_reactions_user   ON engagement.reactions (user_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE engagement.comments (
                id                UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                post_id           UUID        NOT NULL,
                author_id         UUID        NOT NULL,
                parent_comment_id UUID,
                body              TEXT        NOT NULL CHECK (char_length(body) >= 1),
                like_count        INTEGER     NOT NULL DEFAULT 0 CHECK (like_count >= 0),
                version           INTEGER     NOT NULL DEFAULT 0,
                created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at        TIMESTAMPTZ,
                CONSTRAINT fk_comment_post          FOREIGN KEY (post_id)
                    REFERENCES content.posts(id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_author        FOREIGN KEY (author_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_parent_comment FOREIGN KEY (parent_comment_id)
                    REFERENCES engagement.comments(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_comments_post   ON engagement.comments (post_id, created_at ASC) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_comments_parent ON engagement.comments (parent_comment_id, created_at ASC) WHERE parent_comment_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_comments_author ON engagement.comments (author_id) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_comments_fts    ON engagement.comments USING GIN (to_tsvector('simple', body)) WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_comment_like_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
                    UPDATE engagement.comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
                ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
                    UPDATE engagement.comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_comment_like_count
            AFTER INSERT OR DELETE ON engagement.reactions
            FOR EACH ROW EXECUTE FUNCTION engagement.sync_comment_like_count()
        `);

		await queryRunner.query(`
            CREATE TABLE engagement.shares (
                id         UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id    UUID        NOT NULL,
                post_id    UUID        NOT NULL,
                caption    TEXT,
                share_type TEXT        NOT NULL DEFAULT 'repost'
                                       CHECK (share_type IN ('repost', 'external_link')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_share_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_share_post FOREIGN KEY (post_id)
                    REFERENCES content.posts(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_shares_post ON engagement.shares (post_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_shares_user ON engagement.shares (user_id)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_comment_like_count ON engagement.reactions`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS engagement.sync_comment_like_count`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS engagement.shares`);
		await queryRunner.query(`DROP TABLE IF EXISTS engagement.comments`);
		await queryRunner.query(`DROP TABLE IF EXISTS engagement.reactions`);
	}
}
