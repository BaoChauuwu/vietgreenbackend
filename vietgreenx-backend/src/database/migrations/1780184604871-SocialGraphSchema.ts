import { MigrationInterface, QueryRunner } from 'typeorm';

export class SocialGraphSchema1780184604871 implements MigrationInterface {
	name = 'SocialGraphSchema1780184604871';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE social_graph.follows (
                id               UUID        PRIMARY KEY DEFAULT uuid_generate_v7(),
                follower_id      UUID        NOT NULL,
                followee_user_id UUID,
                followee_org_id  UUID,
                status           TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'pending', 'removed')),
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                -- NOTE: No UNIQUE constraint here — partial unique indexes below handle this
                -- because PostgreSQL treats NULL != NULL in UNIQUE constraints, making
                -- UNIQUE(follower_id, followee_user_id, followee_org_id) bypassable when
                -- the nullable column is NULL. Partial indexes are the correct solution.
                CONSTRAINT chk_follow_target CHECK (
                    (followee_user_id IS NOT NULL AND followee_org_id IS NULL) OR
                    (followee_user_id IS NULL AND followee_org_id IS NOT NULL)
                ),
                CONSTRAINT fk_follow_follower      FOREIGN KEY (follower_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_follow_followee_user FOREIGN KEY (followee_user_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_follow_followee_org  FOREIGN KEY (followee_org_id)
                    REFERENCES identity.organizations(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX uq_follow_user ON social_graph.follows (follower_id, followee_user_id) WHERE followee_user_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX uq_follow_org  ON social_graph.follows (follower_id, followee_org_id)  WHERE followee_org_id  IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_follows_follower      ON social_graph.follows (follower_id)      WHERE status = 'active'`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_follows_followee_user ON social_graph.follows (followee_user_id) WHERE status = 'active'`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_follows_followee_org  ON social_graph.follows (followee_org_id)  WHERE status = 'active'`,
		);

		await queryRunner.query(`
            CREATE TABLE social_graph.blocks (
                id         UUID    PRIMARY KEY DEFAULT uuid_generate_v7(),
                blocker_id UUID    NOT NULL,
                blocked_id UUID    NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_block         UNIQUE (blocker_id, blocked_id),
                CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE,
                CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id)
                    REFERENCES identity.users(id) ON DELETE CASCADE
            )
        `);
		await queryRunner.query(
			`CREATE INDEX idx_blocks_blocker ON social_graph.blocks (blocker_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_blocks_blocked ON social_graph.blocks (blocked_id)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS social_graph.blocks`);
		await queryRunner.query(`DROP TABLE IF EXISTS social_graph.follows`);
	}
}
