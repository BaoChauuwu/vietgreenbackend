import { MigrationInterface, QueryRunner } from 'typeorm';

export class MessagingSchema1780184606191 implements MigrationInterface {
	name = 'MessagingSchema1780184606191';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE messaging.conversations (
                id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                conversation_type    TEXT        NOT NULL DEFAULT 'direct'
                                                 CHECK (conversation_type IN ('direct', 'group')),
                name                 TEXT,
                last_message_at      TIMESTAMPTZ,
                created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_conv_last_msg ON messaging.conversations (last_message_at DESC)`,
		);

		await queryRunner.query(`
            CREATE TABLE messaging.conversation_members (
                conversation_id UUID        NOT NULL,
                user_id         UUID        NOT NULL,
                joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_read_at    TIMESTAMPTZ,
                is_muted        BOOLEAN     NOT NULL DEFAULT FALSE,
                PRIMARY KEY (conversation_id, user_id),
                CONSTRAINT fk_cm_conversation FOREIGN KEY (conversation_id)
                    REFERENCES messaging.conversations(id) ON DELETE CASCADE,
                CONSTRAINT fk_cm_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_cm_user ON messaging.conversation_members (user_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE messaging.messages (
                id               UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                conversation_id  UUID        NOT NULL,
                sender_id        UUID        NOT NULL,
                body             TEXT,
                media_id         UUID,
                message_type     TEXT        NOT NULL DEFAULT 'text'
                                             CHECK (message_type IN ('text', 'image', 'product_card', 'system')),
                metadata         JSONB       NOT NULL DEFAULT '{}',
                read_by          UUID[]      NOT NULL DEFAULT '{}',
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at       TIMESTAMPTZ,
                CONSTRAINT chk_msg_body CHECK (body IS NOT NULL OR media_id IS NOT NULL),
                CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id)
                    REFERENCES messaging.conversations(id) ON DELETE CASCADE,
                CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_msg_media FOREIGN KEY (media_id)
                    REFERENCES media.media(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_msg_conv ON messaging.messages (conversation_id, created_at ASC) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_msg_sender ON messaging.messages (sender_id) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_msg_brin ON messaging.messages USING BRIN (created_at)`,
		);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION messaging.update_conv_last_message_at()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            DECLARE
                latest_ts TIMESTAMPTZ;
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    -- New message → set last_message_at to this message's timestamp
                    UPDATE messaging.conversations
                    SET last_message_at = NEW.created_at,
                        updated_at      = NOW()
                    WHERE id = NEW.conversation_id;
                ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                    -- Message soft-deleted → recalculate last_message_at from remaining messages
                    SELECT MAX(created_at) INTO latest_ts
                    FROM messaging.messages
                    WHERE conversation_id = OLD.conversation_id
                      AND deleted_at IS NULL;
                    UPDATE messaging.conversations
                    SET last_message_at = latest_ts,
                        updated_at      = NOW()
                    WHERE id = OLD.conversation_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_conv_last_message_at
            AFTER INSERT OR UPDATE ON messaging.messages
            FOR EACH ROW EXECUTE FUNCTION messaging.update_conv_last_message_at()
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_conv_last_message_at ON messaging.messages`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS messaging.update_conv_last_message_at`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS messaging.messages`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS messaging.conversation_members`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS messaging.conversations`);
	}
}
