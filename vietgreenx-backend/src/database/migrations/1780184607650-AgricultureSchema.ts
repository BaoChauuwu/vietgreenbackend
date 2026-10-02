import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgricultureSchema1780184607650 implements MigrationInterface {
	name = 'AgricultureSchema1780184607650';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE agriculture.categories (
                id            UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                parent_id     UUID,
                name_vi       TEXT        NOT NULL,
                name_en       TEXT        NOT NULL,
                slug          TEXT        NOT NULL UNIQUE,
                icon_url      TEXT,
                sort_order    SMALLINT    NOT NULL DEFAULT 0,
                is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
                product_count INTEGER     NOT NULL DEFAULT 0,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at    TIMESTAMPTZ,
                CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id)
                    REFERENCES agriculture.categories(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_cat_parent ON agriculture.categories (parent_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.green_profiles (
                id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id              UUID        UNIQUE,
                organization_id      UUID        UNIQUE,
                profile_name         TEXT        NOT NULL,
                province             TEXT        NOT NULL,
                district             TEXT,
                ward                 TEXT,
                address_detail       TEXT,
                location             geography(Point, 4326),
                growing_zone_code    TEXT,
                main_category_ids    UUID[]      NOT NULL DEFAULT '{}',
                farm_area_ha         DECIMAL(10,2),
                annual_yield_tonnes  DECIMAL(12,2),
                photo_media_ids      UUID[]      NOT NULL DEFAULT '{}',
                video_media_ids      UUID[]      NOT NULL DEFAULT '{}',
                rating               DECIMAL(3,2),
                review_count         INTEGER     NOT NULL DEFAULT 0,
                slug                 TEXT        UNIQUE,
                meta_description     TEXT,
                is_published         BOOLEAN     NOT NULL DEFAULT FALSE,
                version              INTEGER     NOT NULL DEFAULT 0,
                created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at           TIMESTAMPTZ,
                CONSTRAINT chk_gp_owner CHECK (
                    (user_id IS NOT NULL AND organization_id IS NULL) OR
                    (user_id IS NULL AND organization_id IS NOT NULL)
                ),
                CONSTRAINT fk_gp_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_gp_org  FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_gp_province  ON agriculture.green_profiles (province)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_gp_published ON agriculture.green_profiles (is_published) WHERE is_published = TRUE AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_gp_location  ON agriculture.green_profiles USING GIST (location)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.certifications (
                id                UUID                            PRIMARY KEY DEFAULT uuid_generate_v7(),
                green_profile_id  UUID                            NOT NULL,
                cert_type         agriculture.certification_type  NOT NULL,
                cert_number       TEXT,
                issuing_authority TEXT                            NOT NULL,
                issue_date        DATE                            NOT NULL,
                expiry_date       DATE                            NOT NULL,
                document_url      TEXT                            NOT NULL,
                status            agriculture.certification_status NOT NULL DEFAULT 'valid',
                alert_sent_30d    BOOLEAN                         NOT NULL DEFAULT FALSE,
                alert_sent_7d     BOOLEAN                         NOT NULL DEFAULT FALSE,
                created_at        TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
                updated_at        TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
                deleted_at        TIMESTAMPTZ,
                CONSTRAINT fk_cert_gp FOREIGN KEY (green_profile_id)
                    REFERENCES agriculture.green_profiles(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_cert_gp      ON agriculture.certifications (green_profile_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_cert_expiry  ON agriculture.certifications (expiry_date) WHERE status = 'valid'`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.products (
                id                   UUID                        PRIMARY KEY DEFAULT uuid_generate_v7(),
                owner_user_id        UUID,
                organization_id      UUID,
                green_profile_id     UUID,
                category_id          UUID                        NOT NULL,
                name                 TEXT                        NOT NULL,
                slug                 TEXT                        UNIQUE,
                description          TEXT,
                production_location  TEXT,
                province             TEXT,
                district             TEXT,
                harvest_date         DATE,
                price_reference      BIGINT,
                price_unit           TEXT,
                available_quantity   DECIMAL(12,2),
                quality_standards    TEXT[]                      NOT NULL DEFAULT '{}',
                photo_media_ids      UUID[]                      NOT NULL DEFAULT '{}',
                status               agriculture.product_status  NOT NULL DEFAULT 'draft',
                is_for_marketplace   BOOLEAN                     NOT NULL DEFAULT FALSE,
                has_qr               BOOLEAN                     NOT NULL DEFAULT FALSE,
                view_count           INTEGER                     NOT NULL DEFAULT 0,
                version              INTEGER                     NOT NULL DEFAULT 0,
                created_at           TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
                updated_at           TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
                deleted_at           TIMESTAMPTZ,
                CONSTRAINT fk_product_owner    FOREIGN KEY (owner_user_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_product_org      FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE RESTRICT,
                CONSTRAINT fk_product_gp       FOREIGN KEY (green_profile_id)
                    REFERENCES agriculture.green_profiles(id) ON DELETE SET NULL,
                CONSTRAINT fk_product_category FOREIGN KEY (category_id)
                    REFERENCES agriculture.categories(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_product_owner    ON agriculture.products (owner_user_id) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_product_org      ON agriculture.products (organization_id) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_product_category ON agriculture.products (category_id, status) WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.product_certifications (
                product_id       UUID NOT NULL,
                certification_id UUID NOT NULL,
                PRIMARY KEY (product_id, certification_id),
                CONSTRAINT fk_pc_product FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE CASCADE,
                CONSTRAINT fk_pc_cert   FOREIGN KEY (certification_id)
                    REFERENCES agriculture.certifications(id) ON DELETE CASCADE
            )
        `);

		await queryRunner.query(`
            CREATE TABLE agriculture.crop_seasons (
                id                    UUID                      PRIMARY KEY DEFAULT uuid_generate_v7(),
                green_profile_id      UUID                      NOT NULL,
                product_id            UUID,
                organization_id       UUID,
                created_by            UUID                      NOT NULL,
                season_name           TEXT                      NOT NULL,
                crop_type             TEXT                      NOT NULL,
                area_ha               DECIMAL(10,2),
                start_date            DATE                      NOT NULL,
                expected_harvest_date DATE                      NOT NULL,
                actual_harvest_date   DATE,
                status                agriculture.season_status NOT NULL DEFAULT 'active',
                notes                 TEXT,
                version               INTEGER                   NOT NULL DEFAULT 0,
                created_at            TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                updated_at            TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                deleted_at            TIMESTAMPTZ,
                CONSTRAINT fk_cs_gp   FOREIGN KEY (green_profile_id)
                    REFERENCES agriculture.green_profiles(id) ON DELETE CASCADE,
                CONSTRAINT fk_cs_prod FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE SET NULL,
                CONSTRAINT fk_cs_org  FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE SET NULL,
                CONSTRAINT fk_cs_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_cs_gp     ON agriculture.crop_seasons (green_profile_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_cs_status ON agriculture.crop_seasons (status)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.batches (
                id               UUID                      PRIMARY KEY DEFAULT uuid_generate_v7(),
                product_id       UUID                      NOT NULL,
                crop_season_id   UUID,
                green_profile_id UUID,
                batch_code       TEXT                      NOT NULL,
                harvest_date     DATE,
                quantity         DECIMAL(12,2)             NOT NULL,
                quantity_unit    TEXT                      NOT NULL,
                quality_standard TEXT,
                quality_notes    TEXT,
                status           agriculture.batch_status  NOT NULL DEFAULT 'created',
                created_by       UUID                      NOT NULL,
                version          INTEGER                   NOT NULL DEFAULT 0,
                created_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                deleted_at       TIMESTAMPTZ,
                UNIQUE (product_id, batch_code),
                CONSTRAINT fk_batch_product FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE RESTRICT,
                CONSTRAINT fk_batch_season  FOREIGN KEY (crop_season_id)
                    REFERENCES agriculture.crop_seasons(id) ON DELETE SET NULL,
                CONSTRAINT fk_batch_gp      FOREIGN KEY (green_profile_id)
                    REFERENCES agriculture.green_profiles(id) ON DELETE SET NULL,
                CONSTRAINT fk_batch_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_batch_product ON agriculture.batches (product_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_batch_season  ON agriculture.batches (crop_season_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_batch_gp      ON agriculture.batches (green_profile_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_batch_status  ON agriculture.batches (status)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.production_logs (
                id              UUID                      PRIMARY KEY DEFAULT uuid_generate_v7(),
                crop_season_id  UUID                      NOT NULL,
                created_by      UUID                      NOT NULL,
                log_date        DATE                      NOT NULL,
                activity_type   agriculture.activity_type NOT NULL,
                input_material  TEXT,
                dosage          TEXT,
                dosage_unit     TEXT,
                notes           TEXT,
                weather         TEXT,
                pest_status     TEXT,
                estimated_yield DECIMAL(12,2),
                media_ids       UUID[]                    NOT NULL DEFAULT '{}',
                created_at      TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_plog_season  FOREIGN KEY (crop_season_id)
                    REFERENCES agriculture.crop_seasons(id) ON DELETE RESTRICT,
                CONSTRAINT fk_plog_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_plog_season   ON agriculture.production_logs (crop_season_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_plog_activity ON agriculture.production_logs (activity_type)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_plog_date     ON agriculture.production_logs (log_date)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_plog_creator  ON agriculture.production_logs (created_by)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.production_log_notes (
                id         UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                log_id     UUID        NOT NULL,
                created_by UUID        NOT NULL,
                note_body  TEXT        NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_plog_note_log     FOREIGN KEY (log_id)
                    REFERENCES agriculture.production_logs(id) ON DELETE RESTRICT,
                CONSTRAINT fk_plog_note_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_plog_note_log ON agriculture.production_log_notes (log_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.public_trace_tokens (
                id          UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                token       UUID        NOT NULL UNIQUE DEFAULT uuid_generate_v7(),
                target_type TEXT        NOT NULL CHECK (target_type IN ('product', 'batch')),
                product_id  UUID,
                batch_id    UUID,
                qr_image_url TEXT,
                scan_count  INTEGER     NOT NULL DEFAULT 0,
                is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
                created_by  UUID        NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_trace_product FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE RESTRICT,
                CONSTRAINT fk_trace_batch   FOREIGN KEY (batch_id)
                    REFERENCES agriculture.batches(id) ON DELETE RESTRICT,
                CONSTRAINT fk_trace_creator FOREIGN KEY (created_by)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_trace_product_lookup ON agriculture.public_trace_tokens (product_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_trace_batch_lookup   ON agriculture.public_trace_tokens (batch_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.qr_scans (
                id         UUID        NOT NULL DEFAULT uuid_generate_v7(),
                scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                token_id   UUID        NOT NULL,
                user_id    UUID,
                ip_address INET,
                user_agent TEXT,
                referrer   TEXT,
                PRIMARY KEY (id, scanned_at),
                CONSTRAINT fk_scan_token FOREIGN KEY (token_id)
                    REFERENCES agriculture.public_trace_tokens(id) ON DELETE CASCADE
            ) PARTITION BY RANGE (scanned_at)
        `);
		await queryRunner.query(`
            CREATE TABLE agriculture.qr_scans_2025
            PARTITION OF agriculture.qr_scans
            FOR VALUES FROM ('2025-01-01') TO ('2026-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE agriculture.qr_scans_2026
            PARTITION OF agriculture.qr_scans
            FOR VALUES FROM ('2026-01-01') TO ('2027-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE agriculture.qr_scans_2027
            PARTITION OF agriculture.qr_scans
            FOR VALUES FROM ('2027-01-01') TO ('2028-01-01')
        `);
		await queryRunner.query(`
            CREATE TABLE agriculture.qr_scans_2028
            PARTITION OF agriculture.qr_scans
            FOR VALUES FROM ('2028-01-01') TO ('2029-01-01')
        `);
		await queryRunner.query(
			`CREATE INDEX idx_scan_token ON agriculture.qr_scans (token_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.qr_quota_tracking (
                id              UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                user_id         UUID,
                organization_id UUID,
                billing_period  TEXT        NOT NULL,
                qr_generated    INTEGER     NOT NULL DEFAULT 0,
                qr_limit        INTEGER     NOT NULL DEFAULT 0,
                extra_quota     INTEGER     NOT NULL DEFAULT 0,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (user_id, billing_period),
                UNIQUE (organization_id, billing_period),
                CONSTRAINT chk_quota_owner CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL),
                CONSTRAINT fk_quota_user FOREIGN KEY (user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_quota_org  FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_quota_user ON agriculture.qr_quota_tracking (user_id, billing_period)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_quota_org  ON agriculture.qr_quota_tracking (organization_id, billing_period)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.product_reviews (
                id          UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                token_id    UUID        NOT NULL,
                reviewer_id UUID        NOT NULL,
                rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
                review_body TEXT,
                is_hidden   BOOLEAN     NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (token_id, reviewer_id),
                CONSTRAINT fk_review_token    FOREIGN KEY (token_id)
                    REFERENCES agriculture.public_trace_tokens(id) ON DELETE CASCADE,
                CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_product_review_token ON agriculture.product_reviews (token_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.trade_posts (
                id               UUID                      PRIMARY KEY DEFAULT uuid_generate_v7(),
                poster_user_id   UUID,
                organization_id  UUID,
                trade_type       agriculture.trade_type    NOT NULL,
                product_id       UUID,
                category_id      UUID,
                title            TEXT                      NOT NULL,
                quantity         DECIMAL(12,2)             NOT NULL,
                quantity_unit    TEXT                      NOT NULL,
                price_reference  BIGINT,
                province         TEXT,
                description      TEXT,
                photo_media_ids  UUID[]                    NOT NULL DEFAULT '{}',
                cert_requirements TEXT[]                   NOT NULL DEFAULT '{}',
                deadline         DATE,
                listing_days     SMALLINT                  NOT NULL DEFAULT 14,
                expires_at       TIMESTAMPTZ               NOT NULL,
                status           agriculture.trade_status  NOT NULL DEFAULT 'active',
                interested_count INTEGER                   NOT NULL DEFAULT 0,
                view_count       INTEGER                   NOT NULL DEFAULT 0,
                version          INTEGER                   NOT NULL DEFAULT 0,
                created_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                deleted_at       TIMESTAMPTZ,
                CONSTRAINT fk_tp_user     FOREIGN KEY (poster_user_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_tp_org      FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE RESTRICT,
                CONSTRAINT fk_tp_product  FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE SET NULL,
                CONSTRAINT fk_tp_category FOREIGN KEY (category_id)
                    REFERENCES agriculture.categories(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_tp_type     ON agriculture.trade_posts (trade_type, status) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_tp_province ON agriculture.trade_posts (province, status) WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_tp_category ON agriculture.trade_posts (category_id, status) WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.quotations (
                id               UUID                         PRIMARY KEY DEFAULT uuid_generate_v7(),
                trade_post_id    UUID,
                sender_user_id   UUID                         NOT NULL,
                receiver_user_id UUID                         NOT NULL,
                product_id       UUID,
                offered_price    BIGINT                       NOT NULL,
                price_unit       TEXT                         NOT NULL,
                quantity         DECIMAL(12,2)                NOT NULL,
                quantity_unit    TEXT                         NOT NULL,
                delivery_terms   TEXT,
                valid_until      DATE                         NOT NULL,
                notes            TEXT,
                status           agriculture.quotation_status NOT NULL DEFAULT 'pending',
                rejection_note   TEXT,
                accepted_at      TIMESTAMPTZ,
                rejected_at      TIMESTAMPTZ,
                expires_at       TIMESTAMPTZ                  NOT NULL,
                version          INTEGER                      NOT NULL DEFAULT 0,
                created_at       TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_quote_trade_post FOREIGN KEY (trade_post_id)
                    REFERENCES agriculture.trade_posts(id) ON DELETE SET NULL,
                CONSTRAINT fk_quote_sender   FOREIGN KEY (sender_user_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_quote_receiver FOREIGN KEY (receiver_user_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_quote_product  FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_quote_sender   ON agriculture.quotations (sender_user_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_quote_receiver ON agriculture.quotations (receiver_user_id)`,
		);

		await queryRunner.query(`
            CREATE TABLE agriculture.orders (
                id               UUID                      PRIMARY KEY DEFAULT uuid_generate_v7(),
                quotation_id     UUID,
                buyer_id         UUID                      NOT NULL,
                seller_id        UUID                      NOT NULL,
                organization_id  UUID,
                product_id       UUID,
                quantity         DECIMAL(12,2)             NOT NULL,
                quantity_unit    TEXT                      NOT NULL,
                agreed_price     BIGINT                    NOT NULL,
                total_amount     BIGINT                    NOT NULL,
                platform_fee     BIGINT                    NOT NULL DEFAULT 0,
                status           agriculture.order_status  NOT NULL DEFAULT 'confirmed',
                delivery_terms   TEXT,
                delivery_address TEXT,
                notes            TEXT,
                completed_at     TIMESTAMPTZ,
                cancelled_at     TIMESTAMPTZ,
                cancel_reason    TEXT,
                version          INTEGER                   NOT NULL DEFAULT 0,
                created_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_order_quotation FOREIGN KEY (quotation_id)
                    REFERENCES agriculture.quotations(id) ON DELETE SET NULL,
                CONSTRAINT fk_order_buyer  FOREIGN KEY (buyer_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_order_seller FOREIGN KEY (seller_id)
                    REFERENCES identity.users(id) ON DELETE RESTRICT,
                CONSTRAINT fk_order_org    FOREIGN KEY (organization_id)
                    REFERENCES identity.organizations(id) ON DELETE SET NULL,
                CONSTRAINT fk_order_product FOREIGN KEY (product_id)
                    REFERENCES agriculture.products(id) ON DELETE SET NULL
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_order_buyer  ON agriculture.orders (buyer_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_order_seller ON agriculture.orders (seller_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_order_status ON agriculture.orders (status)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.orders`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.quotations`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.trade_posts`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.product_reviews`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS agriculture.qr_quota_tracking`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.qr_scans_2028`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.qr_scans_2027`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.qr_scans_2026`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.qr_scans_2025`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.qr_scans`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS agriculture.public_trace_tokens`,
		);
		await queryRunner.query(
			`DROP TABLE IF EXISTS agriculture.production_log_notes`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.production_logs`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.batches`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.crop_seasons`);
		await queryRunner.query(
			`DROP TABLE IF EXISTS agriculture.product_certifications`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.products`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.certifications`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.green_profiles`);
		await queryRunner.query(`DROP TABLE IF EXISTS agriculture.categories`);
	}
}
