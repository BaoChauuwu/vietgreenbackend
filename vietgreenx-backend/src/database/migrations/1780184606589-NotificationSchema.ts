import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationSchema1780184606589 implements MigrationInterface {
	name = 'NotificationSchema1780184606589';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE notification.notifications (
                id           UUID                       PRIMARY KEY DEFAULT uuid_generate_v7(),
                recipient_id UUID                       NOT NULL,
                actor_id     UUID,
                notif_type   notification.notif_type    NOT NULL,
                entity_type  TEXT,
                entity_id    UUID,
                title        TEXT                       NOT NULL,
                body         TEXT,
                deep_link    TEXT,
                is_read      BOOLEAN                    NOT NULL DEFAULT FALSE,
                read_at      TIMESTAMPTZ,
                created_at   TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_notif_actor FOREIGN KEY (actor_id)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_notif_inbox  ON notification.notifications (recipient_id, created_at DESC) WHERE is_read = FALSE`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_notif_all    ON notification.notifications (recipient_id, created_at DESC)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_notif_entity ON notification.notifications (entity_type, entity_id) WHERE entity_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_notif_brin   ON notification.notifications USING BRIN (created_at)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS notification.notifications`);
	}
}
