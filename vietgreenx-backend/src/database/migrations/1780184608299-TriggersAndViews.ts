import { MigrationInterface, QueryRunner } from 'typeorm';

export class TriggersAndViews1780184608299 implements MigrationInterface {
	name = 'TriggersAndViews1780184608299';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.set_updated_at()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$
        `);

		const updatedAtTables: string[] = [
			'identity.users',
			'identity.profiles',
			'identity.user_settings',
			'identity.organizations',
			'identity.organization_members',
			'identity.verification_requests',
			'identity.fcm_devices',
			'content.posts',
			'engagement.comments',
			'messaging.conversations',
			'moderation.reports',
			'system.feature_flags',
			'system.app_versions',
			'system.maintenance_windows',
			'agriculture.categories',
			'agriculture.green_profiles',
			'agriculture.certifications',
			'agriculture.products',
			'agriculture.crop_seasons',
			'agriculture.batches',
			'agriculture.qr_quota_tracking',
			'agriculture.trade_posts',
			'agriculture.quotations',
			'agriculture.orders',
		];

		for (const table of updatedAtTables) {
			const triggerName = `trg_updated_at_${table.replace('.', '_')}`;
			await queryRunner.query(`
                CREATE TRIGGER ${triggerName}
                BEFORE UPDATE ON ${table}
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
            `);
		}

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION identity.auto_create_profile()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                INSERT INTO identity.profiles (user_id, display_name)
                VALUES (NEW.id, NEW.username)
                ON CONFLICT (user_id) DO NOTHING;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_auto_create_profile
            AFTER INSERT ON identity.users
            FOR EACH ROW EXECUTE FUNCTION identity.auto_create_profile()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_post_reaction_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
                    UPDATE content.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
                ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
                    UPDATE content.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_post_reaction_count
            AFTER INSERT OR DELETE ON engagement.reactions
            FOR EACH ROW EXECUTE FUNCTION engagement.sync_post_reaction_count()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_post_comment_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                -- INSERT top-level comment → increment
                IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NULL THEN
                    UPDATE content.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
                -- Soft delete top-level comment → decrement
                ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND NEW.parent_comment_id IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
                -- Hard delete top-level comment (via DELETE or CASCADE) → decrement
                ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NULL AND OLD.deleted_at IS NULL THEN
                    UPDATE content.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_post_comment_count
            AFTER INSERT OR UPDATE OR DELETE ON engagement.comments
            FOR EACH ROW EXECUTE FUNCTION engagement.sync_post_comment_count()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION engagement.sync_post_share_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    UPDATE content.posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE content.posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_post_share_count
            AFTER INSERT OR DELETE ON engagement.shares
            FOR EACH ROW EXECUTE FUNCTION engagement.sync_post_share_count()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION social_graph.sync_follow_counters()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                -- INSERT active follow
                IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
                    -- follower's following_count +1
                    UPDATE identity.profiles SET following_count = following_count + 1
                        WHERE user_id = NEW.follower_id;
                    -- followee's follower_count +1 (user only)
                    IF NEW.followee_user_id IS NOT NULL THEN
                        UPDATE identity.profiles SET follower_count = follower_count + 1
                            WHERE user_id = NEW.followee_user_id;
                    END IF;
                -- DELETE or status changed to 'removed'
                ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
                    UPDATE identity.profiles SET following_count = GREATEST(following_count - 1, 0)
                        WHERE user_id = OLD.follower_id;
                    IF OLD.followee_user_id IS NOT NULL THEN
                        UPDATE identity.profiles SET follower_count = GREATEST(follower_count - 1, 0)
                            WHERE user_id = OLD.followee_user_id;
                    END IF;
                -- UPDATE: status changed active→removed
                ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
                    UPDATE identity.profiles SET following_count = GREATEST(following_count - 1, 0)
                        WHERE user_id = OLD.follower_id;
                    IF OLD.followee_user_id IS NOT NULL THEN
                        UPDATE identity.profiles SET follower_count = GREATEST(follower_count - 1, 0)
                            WHERE user_id = OLD.followee_user_id;
                    END IF;
                -- UPDATE: status changed removed→active
                ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
                    UPDATE identity.profiles SET following_count = following_count + 1
                        WHERE user_id = NEW.follower_id;
                    IF NEW.followee_user_id IS NOT NULL THEN
                        UPDATE identity.profiles SET follower_count = follower_count + 1
                            WHERE user_id = NEW.followee_user_id;
                    END IF;
                END IF;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_follow_counters
            AFTER INSERT OR UPDATE OR DELETE ON social_graph.follows
            FOR EACH ROW EXECUTE FUNCTION social_graph.sync_follow_counters()
        `);

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
		await queryRunner.query(`
            CREATE TRIGGER trg_post_count
            AFTER INSERT OR UPDATE OR DELETE ON content.posts
            FOR EACH ROW EXECUTE FUNCTION content.sync_post_count()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION agriculture.sync_scan_count()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                UPDATE agriculture.public_trace_tokens
                SET scan_count = scan_count + 1
                WHERE id = NEW.token_id;
                RETURN NULL;
            END;
            $$
        `);
		await queryRunner.query(`
            CREATE TRIGGER trg_scan_count
            AFTER INSERT ON agriculture.qr_scans
            FOR EACH ROW EXECUTE FUNCTION agriculture.sync_scan_count()
        `);

		await queryRunner.query(`
            CREATE OR REPLACE VIEW social_graph.v_follow_counts AS
            SELECT
                followee_user_id AS user_id,
                COUNT(*)         AS follower_count
            FROM social_graph.follows
            WHERE status = 'active' AND followee_user_id IS NOT NULL
            GROUP BY followee_user_id
        `);

		await queryRunner.query(`
            CREATE OR REPLACE VIEW agriculture.v_green_profile_cert_summary AS
            SELECT
                gp.id                                          AS green_profile_id,
                gp.profile_name,
                COUNT(c.id) FILTER (WHERE c.status = 'valid') AS valid_cert_count,
                MAX(c.expiry_date)                             AS latest_expiry
            FROM agriculture.green_profiles gp
            LEFT JOIN agriculture.certifications c ON c.green_profile_id = gp.id
            WHERE gp.deleted_at IS NULL
            GROUP BY gp.id, gp.profile_name
        `);

		await queryRunner.query(`
            CREATE OR REPLACE VIEW messaging.v_unread_message_counts AS
            SELECT
                cm.user_id,
                cm.conversation_id,
                COUNT(m.id) AS unread_count
            FROM messaging.conversation_members cm
            JOIN messaging.messages m
                ON m.conversation_id = cm.conversation_id
                AND m.deleted_at IS NULL
                AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01')
                AND m.sender_id != cm.user_id
            GROUP BY cm.user_id, cm.conversation_id
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP VIEW IF EXISTS messaging.v_unread_message_counts`,
		);
		await queryRunner.query(
			`DROP VIEW IF EXISTS agriculture.v_green_profile_cert_summary`,
		);
		await queryRunner.query(`DROP VIEW IF EXISTS social_graph.v_follow_counts`);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_auto_create_profile ON identity.users`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS identity.auto_create_profile`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_post_count ON content.posts`,
		);
		await queryRunner.query(`DROP FUNCTION IF EXISTS content.sync_post_count`);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_follow_counters ON social_graph.follows`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS social_graph.sync_follow_counters`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_scan_count ON agriculture.qr_scans`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS agriculture.sync_scan_count`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_post_share_count ON engagement.shares`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS engagement.sync_post_share_count`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_post_comment_count ON engagement.comments`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS engagement.sync_post_comment_count`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_post_reaction_count ON engagement.reactions`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS engagement.sync_post_reaction_count`,
		);

		const updatedAtTables: string[] = [
			'agriculture.orders',
			'agriculture.quotations',
			'agriculture.trade_posts',
			'agriculture.qr_quota_tracking',
			'agriculture.batches',
			'agriculture.crop_seasons',
			'agriculture.products',
			'agriculture.certifications',
			'agriculture.green_profiles',
			'agriculture.categories',
			'system.maintenance_windows',
			'system.app_versions',
			'system.feature_flags',
			'moderation.reports',
			'messaging.conversations',
			'engagement.comments',
			'content.posts',
			'identity.fcm_devices',
			'identity.verification_requests',
			'identity.organization_members',
			'identity.organizations',
			'identity.user_settings',
			'identity.profiles',
			'identity.users',
		];
		for (const table of updatedAtTables) {
			const triggerName = `trg_updated_at_${table.replace('.', '_')}`;
			await queryRunner.query(
				`DROP TRIGGER IF EXISTS ${triggerName} ON ${table}`,
			);
		}

		await queryRunner.query(`DROP FUNCTION IF EXISTS public.set_updated_at`);
	}
}
