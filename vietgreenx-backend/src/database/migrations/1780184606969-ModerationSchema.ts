import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModerationSchema1780184606969 implements MigrationInterface {
	name = 'ModerationSchema1780184606969';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE moderation.reports (
                id           UUID                        PRIMARY KEY DEFAULT uuid_generate_v7(),
                reporter_id  UUID                        NOT NULL,
                target_type  TEXT                        NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'product')),
                target_id    UUID                        NOT NULL,
                reason       moderation.report_reason    NOT NULL,
                details      TEXT,
                status       moderation.report_status    NOT NULL DEFAULT 'pending',
                actioned_by  UUID,
                action_taken TEXT,
                action_note  TEXT,
                actioned_at  TIMESTAMPTZ,
                created_at   TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
                updated_at   TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_report_reporter   FOREIGN KEY (reporter_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_report_actioned_by FOREIGN KEY (actioned_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_reports_target  ON moderation.reports (target_type, target_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_reports_status  ON moderation.reports (status) WHERE status IN ('pending', 'under_review')`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_reports_reporter ON moderation.reports (reporter_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE moderation.audit_logs (
                id            UUID        NOT NULL DEFAULT uuid_generate_v7(),
                created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                user_id       UUID,
                actor_role    identity.user_role,
                action        TEXT        NOT NULL,
                resource_type TEXT,
                resource_id   UUID,
                ip_address    INET,
                user_agent    TEXT,
                metadata      JSONB       NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at)
        `);
		await queryRunner.query(`
            CREATE TABLE moderation.audit_logs_2025
            PARTITION OF moderation.audit_logs
            FOR VALUES FROM ('2025-01-01') TO ('2026-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE moderation.audit_logs_2026
            PARTITION OF moderation.audit_logs
            FOR VALUES FROM ('2026-01-01') TO ('2027-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE moderation.audit_logs_2027
            PARTITION OF moderation.audit_logs
            FOR VALUES FROM ('2027-01-01') TO ('2028-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE moderation.audit_logs_2028
            PARTITION OF moderation.audit_logs
            FOR VALUES FROM ('2028-01-01') TO ('2029-01-01')
        `);
		await queryRunner.query(
			`CREATE INDEX idx_audit_user     ON moderation.audit_logs (user_id, created_at DESC)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_audit_resource ON moderation.audit_logs (resource_type, resource_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_audit_brin     ON moderation.audit_logs USING BRIN (created_at)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.audit_logs_2028`);
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.audit_logs_2027`);
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.audit_logs_2026`);
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.audit_logs_2025`);
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.audit_logs`);
		await queryRunner.query(`DROP TABLE IF EXISTS moderation.reports`);
	}
}
