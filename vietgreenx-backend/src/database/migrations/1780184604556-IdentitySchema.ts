import { MigrationInterface, QueryRunner } from 'typeorm';

export class IdentitySchema1780184604556 implements MigrationInterface {
	name = 'IdentitySchema1780184604556';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE identity.users (
                id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                username           TEXT        NOT NULL,
                email              TEXT,
                phone              TEXT,
                password_hash      TEXT        NOT NULL,
                auth_provider      TEXT        NOT NULL DEFAULT 'local',
                auth_provider_id   TEXT,
                role               identity.user_role          NOT NULL DEFAULT 'consumer',
                status             identity.user_status        NOT NULL DEFAULT 'active',
                verification_level identity.verification_level NOT NULL DEFAULT 'unverified',
                email_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
                phone_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
                last_login_at      TIMESTAMPTZ,
                version            INTEGER     NOT NULL DEFAULT 0,
                created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at         TIMESTAMPTZ,
                CONSTRAINT uq_users_username UNIQUE (username),
                CONSTRAINT uq_users_provider UNIQUE (auth_provider, auth_provider_id),
                CONSTRAINT chk_users_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
            )
        `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX uq_users_email_active ON identity.users (email) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX uq_users_phone_active ON identity.users (phone) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_email       ON identity.users (email)              WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_phone       ON identity.users (phone)              WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_role        ON identity.users (role)               WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_status      ON identity.users (status)             WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_verif_level ON identity.users (verification_level)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_users_created_at  ON identity.users (created_at DESC)`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.profiles (
                id              UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id         UUID        NOT NULL UNIQUE,
                display_name    TEXT        NOT NULL,
                bio             TEXT        CHECK (char_length(bio) <= 300),
                avatar_media_id UUID,
                cover_media_id  UUID,
                website         TEXT,
                province        TEXT,
                district        TEXT,
                ward            TEXT,
                location        geography(Point, 4326),
                is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
                is_private      BOOLEAN     NOT NULL DEFAULT FALSE,
                follower_count  INTEGER     NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
                following_count INTEGER     NOT NULL DEFAULT 0 CHECK (following_count >= 0),
                post_count      INTEGER     NOT NULL DEFAULT 0 CHECK (post_count >= 0),
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_profiles_user_id  ON identity.profiles (user_id)`,
		);
		try {
			await queryRunner.query(
				`CREATE INDEX idx_profiles_location ON identity.profiles USING GIST (location) WHERE location IS NOT NULL`,
			);
		} catch {}
		await queryRunner.query(
			`CREATE INDEX idx_profiles_verified ON identity.profiles (is_verified) WHERE is_verified = TRUE`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_profiles_fts ON identity.profiles USING GIN (to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(bio,'')))`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.organizations (
                id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                owner_user_id         UUID        NOT NULL,
                org_type              identity.org_type NOT NULL DEFAULT 'cooperative',
                name                  TEXT        NOT NULL,
                slug                  TEXT        NOT NULL UNIQUE,
                tax_code              TEXT,
                registration_number   TEXT,
                address               TEXT,
                province              TEXT,
                district              TEXT,
                ward                  TEXT,
                location              geography(Point, 4326),
                description           TEXT,
                logo_media_id         UUID,
                cover_media_id        UUID,
                website               TEXT,
                registration_cert_url TEXT,
                verification_level    identity.verification_level NOT NULL DEFAULT 'unverified',
                is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
                member_limit          INTEGER     NOT NULL DEFAULT 10,
                follower_count        INTEGER     NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
                version               INTEGER     NOT NULL DEFAULT 0,
                created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at            TIMESTAMPTZ,
                CONSTRAINT fk_org_owner FOREIGN KEY (owner_user_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT chk_org_slug CHECK (slug ~ '^[a-z0-9-]+$')
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_org_owner    ON identity.organizations (owner_user_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_org_slug     ON identity.organizations (slug)     WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_org_province ON identity.organizations (province) WHERE deleted_at IS NULL`,
		);
		try {
			await queryRunner.query(
				`CREATE INDEX idx_org_location ON identity.organizations USING GIST (location)`,
			);
		} catch {}
		await queryRunner.query(
			`CREATE INDEX idx_org_fts ON identity.organizations USING GIN (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'')))`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.organization_members (
                id              UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                organization_id UUID        NOT NULL,
                user_id         UUID        NOT NULL,
                org_role        TEXT        NOT NULL DEFAULT 'org_member'
                                CHECK (org_role IN ('org_admin', 'org_member', 'org_viewer')),
                invited_by      UUID,
                joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                status          TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'inactive', 'invited', 'removed')),
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_org_member         UNIQUE (organization_id, user_id),
                CONSTRAINT fk_org_member_org     FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE CASCADE,
                CONSTRAINT fk_org_member_user    FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_org_member_inviter FOREIGN KEY (invited_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_org_member_org    ON identity.organization_members (organization_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_org_member_user   ON identity.organization_members (user_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_org_member_active ON identity.organization_members (organization_id) WHERE status = 'active'`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.rbac_roles (
                id          UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                name        TEXT    NOT NULL UNIQUE,
                description TEXT,
                is_system   BOOLEAN NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

		await queryRunner.query(`
            CREATE TABLE identity.rbac_permissions (
                id          UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                resource    TEXT    NOT NULL,
                action      TEXT    NOT NULL,
                description TEXT,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_perm UNIQUE (resource, action)
            )
        `);

		await queryRunner.query(`
            CREATE TABLE identity.rbac_role_permissions (
                role_id       UUID NOT NULL,
                permission_id UUID NOT NULL,
                granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                granted_by    UUID,
                PRIMARY KEY (role_id, permission_id),
                CONSTRAINT fk_rp_role FOREIGN KEY (role_id)
                    REFERENCES identity.rbac_roles(id) ON DELETE CASCADE,
                CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id)
                    REFERENCES identity.rbac_permissions(id) ON DELETE CASCADE
            )
        `);

		await queryRunner.query(`
            CREATE TABLE identity.user_sessions (
                id           UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id      UUID        NOT NULL,
                token_hash   TEXT        NOT NULL UNIQUE,
                device_id    TEXT,
                device_name  TEXT,
                ip_address   INET,
                user_agent   TEXT,
                platform     TEXT        CHECK (platform IN ('ios', 'android', 'web', 'desktop')),
                expires_at   TIMESTAMPTZ NOT NULL,
                revoked_at   TIMESTAMPTZ,
                last_used_at TIMESTAMPTZ,
                created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_session_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX idx_sessions_token   ON identity.user_sessions (token_hash) WHERE revoked_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_sessions_user    ON identity.user_sessions (user_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_sessions_expires ON identity.user_sessions (expires_at) WHERE revoked_at IS NULL`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.user_settings (
                id                    UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id               UUID    NOT NULL UNIQUE,
                language              TEXT    NOT NULL DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
                timezone              TEXT    NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
                theme                 TEXT    NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
                who_can_follow        TEXT    NOT NULL DEFAULT 'everyone' CHECK (who_can_follow IN ('everyone', 'approved')),
                who_can_message       TEXT    NOT NULL DEFAULT 'followers' CHECK (who_can_message IN ('everyone', 'followers', 'nobody')),
                show_online_status    BOOLEAN NOT NULL DEFAULT TRUE,
                hide_transactions_tab BOOLEAN NOT NULL DEFAULT FALSE,
                notif_new_follower    BOOLEAN NOT NULL DEFAULT TRUE,
                notif_post_reaction   BOOLEAN NOT NULL DEFAULT TRUE,
                notif_post_comment    BOOLEAN NOT NULL DEFAULT TRUE,
                notif_mention         BOOLEAN NOT NULL DEFAULT TRUE,
                notif_new_message     BOOLEAN NOT NULL DEFAULT TRUE,
                notif_new_quotation   BOOLEAN NOT NULL DEFAULT TRUE,
                notif_trade_update    BOOLEAN NOT NULL DEFAULT TRUE,
                notif_system          BOOLEAN NOT NULL DEFAULT TRUE,
                notif_push_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
                notif_email_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
                notif_sms_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
                created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);

		await queryRunner.query(`
            CREATE TABLE identity.verification_requests (
                id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id            UUID,
                organization_id    UUID,
                requested_level    identity.verification_level NOT NULL,
                document_type      TEXT        NOT NULL CHECK (document_type IN ('national_id','business_registration','partnership_agreement','other')),
                document_front_url TEXT        NOT NULL,
                document_back_url  TEXT,
                additional_docs    JSONB       NOT NULL DEFAULT '[]',
                status             TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected')),
                rejection_reason   TEXT,
                reviewed_by        UUID,
                reviewed_at        TIMESTAMPTZ,
                submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT chk_verif_target CHECK (
                    (user_id IS NOT NULL AND organization_id IS NULL) OR
                    (user_id IS NULL AND organization_id IS NOT NULL)
                ),
                CONSTRAINT fk_verif_user     FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_verif_org      FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE CASCADE,
                CONSTRAINT fk_verif_reviewer FOREIGN KEY (reviewed_by)
                    REFERENCES identity.users(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_verif_user    ON identity.verification_requests (user_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_verif_org     ON identity.verification_requests (organization_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_verif_pending ON identity.verification_requests (submitted_at ASC) WHERE status = 'pending'`,
		);

		await queryRunner.query(`
            CREATE TABLE identity.fcm_devices (
                id          UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id     UUID    NOT NULL,
                fcm_token   TEXT    NOT NULL UNIQUE,
                platform    TEXT    NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
                device_id   TEXT,
                app_version TEXT,
                is_active   BOOLEAN NOT NULL DEFAULT TRUE,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_fcm_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_fcm_user ON identity.fcm_devices (user_id) WHERE is_active = TRUE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS identity.fcm_devices`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS identity.verification_requests`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.user_settings`);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.user_sessions`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS identity.rbac_role_permissions`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.rbac_permissions`);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.rbac_roles`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS identity.organization_members`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.organizations`);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.profiles`);
		await queryRunner.query(`DROP TABLE IF EXISTS identity.users`);
	}
}
