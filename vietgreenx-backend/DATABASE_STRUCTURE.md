# VietGreenX — Database Structure Reference

## Stack

- PostgreSQL 16 + PostGIS
- TypeORM 0.3.27 (NestJS 11)
- Schema file: `vietgreenx_db_MVP.sql`

---

## Migrations

**Chiến lược:** VietGreenX KHÔNG dùng TypeORM migration generate.  
Schema được tạo hoàn toàn từ `vietgreenx_db_MVP.sql` (chạy trực tiếp trên DB).

Nếu cần thêm migration mới, tạo thủ công theo pattern:

```
src/database/migrations/
  <timestamp>-<mô-tả-ngắn>.ts
```

Ví dụ:

```typescript
// src/database/migrations/1762000000000-add-green-profile-index.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGreenProfileIndex1762000000000 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE INDEX idx_green_profiles_user_id ON agriculture.green_profiles (user_id);
    `);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      DROP INDEX IF EXISTS agriculture.idx_green_profiles_user_id;
    `);
	}
}
```

Chạy: `npm run typeorm migration:run`

---

## Seeds

```
src/database/data/
  users.ts          ← seed data cho bảng identity.users
  <table>.ts        ← thêm file theo tên bảng khi cần
```

### Cách viết seed chuẩn

```typescript
// src/database/data/categories.ts
import { CategoryType } from '@app/common/enums/category-type.enum';

export const categories = [
	{
		name: 'Rau củ',
		slug: 'rau-cu',
		type: CategoryType.PRODUCT,
		parentId: null,
	},
	{
		name: 'Trái cây',
		slug: 'trai-cay',
		type: CategoryType.PRODUCT,
		parentId: null,
	},
];
```

### Seed runner pattern (DatabaseSeedService)

```typescript
// src/database/seeds/database-seed.service.ts
@Injectable()
export class DatabaseSeedService {
	constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

	async seed() {
		// Chỉ seed nếu bảng trống
		const count = await this.userRepo.count();
		if (count > 0) return;

		for (const u of users) {
			const user = this.userRepo.create({
				username: u.username,
				email: u.email,
				phone: u.phone,
				passwordHash: await bcrypt.hash(u.password, 10),
				role: u.role,
				status: u.status,
			});
			await this.userRepo.save(user);
		}
	}
}
```

---

## Schemas & Entities

| Schema         | Bảng chính                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity`     | users, profiles, organizations, organization_members, rbac_roles, rbac_permissions, rbac_role_permissions, user_sessions, user_settings, verification_requests, fcm_devices                                                                    |
| `social_graph` | follows, blocks                                                                                                                                                                                                                                |
| `media`        | media                                                                                                                                                                                                                                          |
| `content`      | posts, post_media, hashtags, post_hashtags, post_tags                                                                                                                                                                                          |
| `engagement`   | reactions, comments, shares                                                                                                                                                                                                                    |
| `messaging`    | conversations, conversation_members, messages                                                                                                                                                                                                  |
| `notification` | notifications                                                                                                                                                                                                                                  |
| `moderation`   | reports, audit_logs                                                                                                                                                                                                                            |
| `system`       | feature_flags, maintenance_windows, app_versions                                                                                                                                                                                               |
| `agriculture`  | categories, green_profiles, certifications, products, crop_seasons, production_logs, production_log_notes, product_certifications, batches, public_trace_tokens, qr_scans, qr_quota_tracking, trade_posts, quotations, orders, product_reviews |
| `analytics`    | user_activity_logs                                                                                                                                                                                                                             |

---

## EntityHelper

```typescript
// extends EntityHelper nếu bảng có: id, created_at, updated_at, deleted_at
export class MyEntity extends EntityHelper { ... }

// KHÔNG extends nếu bảng có composite PK hoặc không có deleted_at
```

**Bảng composite PK (không dùng EntityHelper):**

- `rbac_role_permissions` (role_id + permission_id)
- `post_media` (post_id + media_id)
- `post_hashtags` (post_id + hashtag_id)
- `conversation_members` (conversation_id + user_id)
- `product_certifications` (product_id + certification_id)
- `qr_scans` (id + created_at) — partitioned
- `audit_logs` (id + created_at) — partitioned
- `user_activity_logs` (id + created_at) — partitioned

---

## Enums (identity schema)

```
user_role:    consumer | seller | cooperative | enterprise | expert | admin
user_status:  active | inactive | banned | pending_deletion
```

Tất cả 20 enum types định nghĩa trong `vietgreenx_db_MVP.sql`, import từ:

```
src/common/enums/<name>.enum.ts
```

---

## Lưu ý quan trọng

- **BIGINT / VND money**: dùng `bigintTransformer` — PostgreSQL trả string, cần parse
- **geography (PostGIS)**: không map trong TypeORM, dùng raw query
- **UUID[]**: `{ type: 'uuid', array: true, default: '{}' }`
- **JSONB**: `{ type: 'jsonb', default: '{}' }`
- **Append-only tables**: `production_logs`, `production_log_notes`, `audit_logs` — không update/delete
- **Partitioned tables**: `audit_logs`, `qr_scans`, `user_activity_logs` — composite PK bắt buộc có partition key
