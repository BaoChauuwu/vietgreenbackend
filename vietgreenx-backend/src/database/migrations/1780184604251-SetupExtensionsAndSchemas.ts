import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetupExtensionsAndSchemas1780184604251
	implements MigrationInterface
{
	name = 'SetupExtensionsAndSchemas1780184604251';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

		// Do not catch failed CREATE EXTENSION statements here. TypeORM runs this
		// migration in a transaction, and PostgreSQL keeps the transaction aborted
		// even when the JavaScript error is caught. pg_uuidv7 is optional because the
		// compatibility function below uses pgcrypto's gen_random_uuid().
		// Do not auto-install PostGIS: managed PostgreSQL can advertise it while
		// denying CREATE EXTENSION to the application user. If PostGIS was installed
		// by an administrator its geography type is reused; otherwise a text domain
		// keeps locations portable and the repository provides a JSON fallback.
		await queryRunner.query(`
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_type WHERE typname = 'geography'
				) THEN
					CREATE DOMAIN geography AS text;
				END IF;
			END
			$$;
		`);
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);

		await queryRunner.query(`
			CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid AS $$
			BEGIN
				RETURN gen_random_uuid();
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS identity`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS social_graph`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS content`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS engagement`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS media`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS messaging`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS notification`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS moderation`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS analytics`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS system`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS agriculture`);

		await queryRunner.query(
			`CREATE TYPE identity.user_status AS ENUM ('active','suspended','deactivated','banned','pending_verification')`,
		);
		await queryRunner.query(
			`CREATE TYPE identity.user_role AS ENUM ('consumer','seller','cooperative','enterprise','expert','admin')`,
		);
		await queryRunner.query(
			`CREATE TYPE identity.verification_level AS ENUM ('unverified','basic','certified','trusted_partner')`,
		);
		await queryRunner.query(
			`CREATE TYPE identity.org_type AS ENUM ('cooperative','enterprise','ngo','government_agency','other')`,
		);

		await queryRunner.query(
			`CREATE TYPE content.visibility_type AS ENUM ('public','followers_only','private')`,
		);
		await queryRunner.query(
			`CREATE TYPE content.post_category AS ENUM ('produce_story','crop_journal','farming_technique','market_price','trade_connection','ocop_vietgap_story')`,
		);

		await queryRunner.query(
			`CREATE TYPE agriculture.trade_type AS ENUM ('sell','buy')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.trade_status AS ENUM ('active','closed','expired','draft')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.quotation_status AS ENUM ('pending','accepted','rejected','expired','withdrawn')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.order_status AS ENUM ('confirmed','in_progress','delivered','completed','disputed','cancelled')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.activity_type AS ENUM ('sowing','caring','fertilizing','spraying','irrigating','harvesting','other')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.season_status AS ENUM ('active','harvested','cancelled')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.product_status AS ENUM ('draft','active','out_of_stock','archived')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.batch_status AS ENUM ('created','qr_generated','shipped','sold','recalled')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.certification_type AS ENUM ('vietgap','globalgap','organic','ocop','halal','iso22000','haccp','other')`,
		);
		await queryRunner.query(
			`CREATE TYPE agriculture.certification_status AS ENUM ('valid','expired','pending_renewal','revoked')`,
		);

		await queryRunner.query(
			`CREATE TYPE notification.notif_type AS ENUM ('new_follower','post_reaction','post_comment','comment_reply','mention','new_quotation','quotation_accepted','quotation_rejected','order_confirmed','order_completed','order_disputed','new_message','verification_approved','verification_rejected','subscription_expiring','qr_quota_warning','certification_expiring','system_announcement','charity_donation_received','review_received')`,
		);

		await queryRunner.query(
			`CREATE TYPE moderation.report_reason AS ENUM ('spam','misinformation','counterfeit_goods','harmful_content','harassment','other')`,
		);
		await queryRunner.query(
			`CREATE TYPE moderation.report_status AS ENUM ('pending','under_review','actioned','dismissed')`,
		);

		await queryRunner.query(
			`CREATE TYPE engagement.reaction_type AS ENUM ('like','love','helpful','trust','thank_you')`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TYPE IF EXISTS engagement.reaction_type`);
		await queryRunner.query(`DROP TYPE IF EXISTS moderation.report_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS moderation.report_reason`);
		await queryRunner.query(`DROP TYPE IF EXISTS notification.notif_type`);
		await queryRunner.query(
			`DROP TYPE IF EXISTS agriculture.certification_status`,
		);
		await queryRunner.query(
			`DROP TYPE IF EXISTS agriculture.certification_type`,
		);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.batch_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.product_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.season_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.activity_type`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.order_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.quotation_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.trade_status`);
		await queryRunner.query(`DROP TYPE IF EXISTS agriculture.trade_type`);
		await queryRunner.query(`DROP TYPE IF EXISTS content.post_category`);
		await queryRunner.query(`DROP TYPE IF EXISTS content.visibility_type`);
		await queryRunner.query(`DROP TYPE IF EXISTS identity.org_type`);
		await queryRunner.query(`DROP TYPE IF EXISTS identity.verification_level`);
		await queryRunner.query(`DROP TYPE IF EXISTS identity.user_role`);
		await queryRunner.query(`DROP TYPE IF EXISTS identity.user_status`);

		await queryRunner.query(`DROP SCHEMA IF EXISTS agriculture CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS system CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS analytics CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS moderation CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS notification CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS messaging CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS media CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS engagement CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS content CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS social_graph CASCADE`);
		await queryRunner.query(`DROP SCHEMA IF EXISTS identity CASCADE`);
	}
}
