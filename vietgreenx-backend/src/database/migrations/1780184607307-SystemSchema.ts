import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemSchema1780184607307 implements MigrationInterface {
	name = 'SystemSchema1780184607307';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE system.feature_flags (
                id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                flag_key            TEXT        NOT NULL UNIQUE,
                description         TEXT,
                is_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
                rollout_percentage  SMALLINT    NOT NULL DEFAULT 0
                                    CHECK (rollout_percentage BETWEEN 0 AND 100),
                allowed_user_ids    UUID[]      NOT NULL DEFAULT '{}',
                allowed_roles       TEXT[]      NOT NULL DEFAULT '{}',
                metadata            JSONB       NOT NULL DEFAULT '{}',
                created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_feature_flags_key ON system.feature_flags (flag_key)`,
		);

		await queryRunner.query(`
            CREATE TABLE system.app_versions (
                id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                platform             TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
                latest_version       TEXT        NOT NULL,
                min_version          TEXT        NOT NULL,
                recommended_version  TEXT,
                force_update         BOOLEAN     NOT NULL DEFAULT FALSE,
                soft_update          BOOLEAN     NOT NULL DEFAULT FALSE,
                store_url_ios        TEXT,
                store_url_android    TEXT,
                release_notes_vi     TEXT,
                release_notes_en     TEXT,
                released_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_by           UUID,
                created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (platform, latest_version),
                CONSTRAINT fk_app_version_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_app_versions_platform_released ON system.app_versions (platform, released_at DESC)`,
		);

		await queryRunner.query(`
            CREATE TABLE system.maintenance_windows (
                id               UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                scope            TEXT        NOT NULL DEFAULT 'all'
                                             CHECK (scope IN ('all', 'ios', 'android', 'web', 'api')),
                starts_at        TIMESTAMPTZ NOT NULL,
                ends_at          TIMESTAMPTZ,
                is_active        BOOLEAN     NOT NULL DEFAULT FALSE,
                title_vi         TEXT        NOT NULL DEFAULT 'Hệ thống đang bảo trì',
                title_en         TEXT        NOT NULL DEFAULT 'System Maintenance',
                body_vi          TEXT        NOT NULL,
                body_en          TEXT        NOT NULL,
                estimated_end_at TIMESTAMPTZ,
                bypass_roles     TEXT[]      NOT NULL DEFAULT '{admin}',
                created_by       UUID,
                updated_by       UUID,
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_mw_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL,
                CONSTRAINT fk_mw_updater FOREIGN KEY (updated_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_mw_active ON system.maintenance_windows (is_active, starts_at) WHERE is_active = TRUE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS system.maintenance_windows`);
		await queryRunner.query(`DROP TABLE IF EXISTS system.app_versions`);
		await queryRunner.query(`DROP TABLE IF EXISTS system.feature_flags`);
	}
}
