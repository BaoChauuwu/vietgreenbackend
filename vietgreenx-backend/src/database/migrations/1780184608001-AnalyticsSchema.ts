import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnalyticsSchema1780184608001 implements MigrationInterface {
	name = 'AnalyticsSchema1780184608001';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs (
                id          UUID        NOT NULL DEFAULT uuid_generate_v7(),
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                user_id     UUID,
                session_id  UUID,
                action      TEXT        NOT NULL,
                entity_type TEXT,
                entity_id   UUID,
                ip_address  INET,
                metadata    JSONB       NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at)
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2025_q1
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2025-01-01') TO ('2025-04-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2025_q2
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2025-04-01') TO ('2025-07-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2025_q3
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2025-07-01') TO ('2025-10-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2025_q4
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2025-10-01') TO ('2026-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2026_q1
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2026-01-01') TO ('2026-04-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2026_q2
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2026-04-01') TO ('2026-07-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2026_q3
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2026-07-01') TO ('2026-10-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2026_q4
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2026-10-01') TO ('2027-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2027_q1
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2027-01-01') TO ('2027-04-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2027_q2
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2027-04-01') TO ('2027-07-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2027_q3
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2027-07-01') TO ('2027-10-01')
        `);
		await queryRunner.query(`
            CREATE TABLE analytics.user_activity_logs_2027_q4
            PARTITION OF analytics.user_activity_logs
            FOR VALUES FROM ('2027-10-01') TO ('2028-01-01')
        `);
		await queryRunner.query(
			`CREATE INDEX idx_ual_user       ON analytics.user_activity_logs (user_id, created_at DESC)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_ual_action     ON analytics.user_activity_logs (action, created_at DESC)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_ual_entity     ON analytics.user_activity_logs (entity_type, entity_id) WHERE entity_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_ual_brin       ON analytics.user_activity_logs USING BRIN (created_at)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2027_q4`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2027_q3`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2027_q2`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2027_q1`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2026_q4`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2026_q3`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2026_q2`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2026_q1`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2025_q4`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2025_q3`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2025_q2`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs_2025_q1`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS analytics.user_activity_logs`,
		);
	}
}
