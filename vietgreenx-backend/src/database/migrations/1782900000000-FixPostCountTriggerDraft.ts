import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPostCountTriggerDraft1782900000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION content.sync_post_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL AND NEW.is_draft = FALSE THEN
                    UPDATE identity.profiles SET post_count = post_count + 1
                        WHERE user_id = NEW.author_id;
                ELSIF TG_OP = 'UPDATE' THEN
                    IF OLD.is_draft = TRUE AND NEW.is_draft = FALSE AND NEW.deleted_at IS NULL THEN
                        -- Draft published: count goes up
                        UPDATE identity.profiles SET post_count = post_count + 1
                            WHERE user_id = NEW.author_id;
                    ELSIF OLD.is_draft = FALSE AND NEW.is_draft = TRUE AND OLD.deleted_at IS NULL THEN
                        -- Published reverted to draft: count goes down
                        UPDATE identity.profiles SET post_count = GREATEST(post_count - 1, 0)
                            WHERE user_id = NEW.author_id;
                    ELSIF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND OLD.is_draft = FALSE THEN
                        -- Soft-delete of a published post: count goes down
                        UPDATE identity.profiles SET post_count = GREATEST(post_count - 1, 0)
                            WHERE user_id = OLD.author_id;
                    END IF;
                ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL AND OLD.is_draft = FALSE THEN
                    UPDATE identity.profiles SET post_count = GREATEST(post_count - 1, 0)
                        WHERE user_id = OLD.author_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION content.sync_post_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL AND NEW.is_draft = FALSE THEN
                    UPDATE identity.profiles SET post_count = post_count + 1
                        WHERE user_id = NEW.author_id;
                ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND OLD.is_draft = FALSE THEN
                    UPDATE identity.profiles SET post_count = GREATEST(post_count - 1, 0)
                        WHERE user_id = OLD.author_id;
                ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL AND OLD.is_draft = FALSE THEN
                    UPDATE identity.profiles SET post_count = GREATEST(post_count - 1, 0)
                        WHERE user_id = OLD.author_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
	}
}
