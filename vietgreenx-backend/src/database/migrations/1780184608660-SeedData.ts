import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1780184608660 implements MigrationInterface {
	name = 'SeedData1780184608660';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            INSERT INTO identity.rbac_roles (name, description) VALUES
                ('consumer',    'Consumer — browse products, place orders, leave reviews'),
                ('seller',      'Individual seller — list products, manage orders'),
                ('cooperative', 'Cooperative — manage organization, multiple members and products'),
                ('enterprise',  'Enterprise — full commerce access, API partner'),
                ('expert',      'Agriculture expert — consulting, certification verification'),
                ('admin',       'System administrator — full access')
            ON CONFLICT DO NOTHING
        `);

		await queryRunner.query(`
            INSERT INTO identity.rbac_permissions (resource, action, description) VALUES
                ('post',         'create',  'Create a post'),
                ('post',         'edit',    'Edit own posts'),
                ('post',         'delete',  'Delete own posts'),
                ('post',         'read',    'View public posts'),
                ('comment',      'create',  'Leave a comment'),
                ('comment',      'edit',    'Edit own comments'),
                ('comment',      'delete',  'Delete own comments'),
                ('comment',      'read',    'View comments'),
                ('product',      'create',  'List a product'),
                ('product',      'edit',    'Edit own products'),
                ('product',      'delete',  'Delete own products'),
                ('product',      'read',    'View products'),
                ('order',        'create',  'Place an order'),
                ('order',        'manage',  'Manage own orders'),
                ('green_profile','create',  'Create an agriculture profile'),
                ('green_profile','edit',    'Edit own profile'),
                ('batch',        'create',  'Create a product batch'),
                ('qr',           'generate','Generate a traceability QR code'),
                ('report',       'create',  'Report a violation'),
                ('report',       'read',    'View own reports'),
                ('admin',        'moderate','Review reports and moderate content'),
                ('admin',        'manage',  'Full system administration access')
            ON CONFLICT DO NOTHING
        `);

		await queryRunner.query(`
            INSERT INTO identity.rbac_role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM identity.rbac_roles r
            JOIN identity.rbac_permissions p ON TRUE
            WHERE
                -- consumer: read everything, create posts/comments/reports, order
                (r.name = 'consumer' AND p.resource IN ('post','comment','report') AND p.action IN ('create','read','delete'))
                OR (r.name = 'consumer' AND p.resource = 'order' AND p.action = 'create')
                OR (r.name = 'consumer' AND p.resource = 'product' AND p.action = 'read')

                -- seller: consumer + manage own products, batches, QR, orders, green_profile
                OR (r.name = 'seller' AND p.resource IN ('post','comment','report') AND p.action IN ('create','edit','read','delete'))
                OR (r.name = 'seller' AND p.resource = 'product' AND p.action IN ('create','edit','delete','read'))
                OR (r.name = 'seller' AND p.resource = 'order' AND p.action IN ('create','manage'))
                OR (r.name = 'seller' AND p.resource = 'green_profile' AND p.action IN ('create','edit'))
                OR (r.name = 'seller' AND p.resource = 'batch' AND p.action = 'create')
                OR (r.name = 'seller' AND p.resource = 'qr' AND p.action = 'generate')

                -- cooperative: same as seller
                OR (r.name = 'cooperative' AND p.resource IN ('post','comment','report') AND p.action IN ('create','edit','read','delete'))
                OR (r.name = 'cooperative' AND p.resource = 'product' AND p.action IN ('create','edit','delete','read'))
                OR (r.name = 'cooperative' AND p.resource = 'order' AND p.action IN ('create','manage'))
                OR (r.name = 'cooperative' AND p.resource = 'green_profile' AND p.action IN ('create','edit'))
                OR (r.name = 'cooperative' AND p.resource = 'batch' AND p.action = 'create')
                OR (r.name = 'cooperative' AND p.resource = 'qr' AND p.action = 'generate')

                -- enterprise: same as cooperative
                OR (r.name = 'enterprise' AND p.resource IN ('post','comment','report') AND p.action IN ('create','edit','read','delete'))
                OR (r.name = 'enterprise' AND p.resource = 'product' AND p.action IN ('create','edit','delete','read'))
                OR (r.name = 'enterprise' AND p.resource = 'order' AND p.action IN ('create','manage'))
                OR (r.name = 'enterprise' AND p.resource = 'green_profile' AND p.action IN ('create','edit'))
                OR (r.name = 'enterprise' AND p.resource = 'batch' AND p.action = 'create')
                OR (r.name = 'enterprise' AND p.resource = 'qr' AND p.action = 'generate')

                -- expert: read + post + comment + report
                OR (r.name = 'expert' AND p.resource IN ('post','comment','report') AND p.action IN ('create','edit','read','delete'))
                OR (r.name = 'expert' AND p.resource = 'product' AND p.action = 'read')

                -- admin: all permissions
                OR r.name = 'admin'
            ON CONFLICT DO NOTHING
        `);

		await queryRunner.query(`
            INSERT INTO agriculture.categories (name_vi, name_en, slug, sort_order) VALUES
                ('Rau củ quả',          'Vegetables & Fruits',  'rau-cu-qua',           1),
                ('Lúa gạo',             'Rice',                 'lua-gao',              2),
                ('Cà phê',              'Coffee',               'ca-phe',               3),
                ('Chè',                 'Tea',                  'che',                  4),
                ('Hồ tiêu',             'Pepper',               'ho-tieu',              5),
                ('Điều',                'Cashew',               'dieu',                 6),
                ('Cao su',              'Rubber',               'cao-su',               7),
                ('Thủy sản',            'Aquatic Products',     'thuy-san',             8),
                ('Thịt gia súc gia cầm','Livestock & Poultry',  'thit-gia-suc-gia-cam', 9),
                ('Trái cây nhiệt đới',  'Tropical Fruits',      'trai-cay-nhiet-doi',   10),
                ('Gia vị',              'Spices & Herbs',       'gia-vi',               11),
                ('Nấm',                 'Mushrooms',            'nam',                  12),
                ('Mật ong',             'Honey',                'mat-ong',              13),
                ('Hạt giống',           'Seeds',                'hat-giong',            14),
                ('Khác',                'Others',               'khac',                 99)
            ON CONFLICT (slug) DO NOTHING
        `);

		await queryRunner.query(`
            INSERT INTO system.feature_flags (flag_key, description, is_enabled) VALUES
                ('social_feed',          'Bật tính năng social feed',               TRUE),
                ('direct_messaging',     'Bật nhắn tin trực tiếp',                  TRUE),
                ('qr_traceability',      'Bật truy xuất nguồn gốc QR',              TRUE),
                ('marketplace',          'Bật chợ nông sản',                        TRUE),
                ('push_notifications',   'Bật push notification',                   TRUE),
                ('expert_consultation',  'Bật tư vấn chuyên gia',                   FALSE),
                ('web3_wallet',          'Bật tính năng Web3 wallet (future)',       FALSE),
                ('ai_recommendations',   'Bật gợi ý AI (future)',                   FALSE)
            ON CONFLICT (flag_key) DO NOTHING
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DELETE FROM system.feature_flags WHERE flag_key IN (
                'social_feed','direct_messaging','qr_traceability','marketplace',
                'push_notifications','expert_consultation','web3_wallet','ai_recommendations'
            )`,
		);
		await queryRunner.query(
			`DELETE FROM agriculture.categories WHERE slug IN (
                'rau-cu-qua','lua-gao','ca-phe','che','ho-tieu','dieu','cao-su',
                'thuy-san','thit-gia-suc-gia-cam','trai-cay-nhiet-doi','gia-vi',
                'nam','mat-ong','hat-giong','khac'
            )`,
		);
		await queryRunner.query(`
            DELETE FROM identity.rbac_role_permissions
            WHERE role_id IN (
                SELECT id FROM identity.rbac_roles
                WHERE name IN ('consumer','seller','cooperative','enterprise','expert','admin')
            )
        `);
		await queryRunner.query(`
            DELETE FROM identity.rbac_permissions
            WHERE (resource, action) IN (
                ('post','create'),('post','edit'),('post','delete'),('post','read'),
                ('comment','create'),('comment','edit'),('comment','delete'),('comment','read'),
                ('product','create'),('product','edit'),('product','delete'),('product','read'),
                ('order','create'),('order','manage'),
                ('green_profile','create'),('green_profile','edit'),
                ('batch','create'),('qr','generate'),
                ('report','create'),('report','read'),
                ('admin','moderate'),('admin','manage')
            )
        `);
		await queryRunner.query(`
            DELETE FROM identity.rbac_roles
            WHERE name IN ('consumer','seller','cooperative','enterprise','expert','admin')
        `);
	}
}
