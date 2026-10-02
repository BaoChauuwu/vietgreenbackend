import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCommentCountIncludeReplies1782600000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Rebuild trigger to count all comments (top-level + replies)
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_post_comment_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                -- INSERT any comment (top-level or reply) → increment
                IF TG_OP = 'INSERT' THEN
                    UPDATE content.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
                -- Soft delete → decrement
                ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
                -- Hard delete (CASCADE) → decrement
                ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);

		// Recalculate comment_count for all existing posts
		await queryRunner.query(`
            UPDATE content.posts p
            SET comment_count = (
                SELECT COUNT(*)
                FROM engagement.comments c
                WHERE c.post_id = p.id
                  AND c.deleted_at IS NULL
            )
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Restore original trigger (top-level only)
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_post_comment_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NULL THEN
                    UPDATE content.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
                ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND NEW.parent_comment_id IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
                ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NULL AND OLD.deleted_at IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);

		// Recalculate back to top-level only
		await queryRunner.query(`
            UPDATE content.posts p
            SET comment_count = (
                SELECT COUNT(*)
                FROM engagement.comments c
                WHERE c.post_id = p.id
                  AND c.parent_comment_id IS NULL
                  AND c.deleted_at IS NULL
            )
        `);
	}
}
