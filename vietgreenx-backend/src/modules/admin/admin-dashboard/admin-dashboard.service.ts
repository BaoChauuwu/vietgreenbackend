import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppVersionRepository } from '@app/database/typeorm/repositories/app-version.repository';
import { AppVersion } from '@app/database/typeorm/entities/system/app-version.entity';
import { ErrorCode, HttpNotFoundError } from '@app/common/errors';
import { CreateAppVersionRequestDto } from './dto/requests/create-app-version.request.dto';
import { UpdateAppVersionRequestDto } from './dto/requests/update-app-version.request.dto';

@Injectable()
export class AdminDashboardService {
	constructor(
		private readonly appVersionRepository: AppVersionRepository,
		private readonly dataSource: DataSource,
	) {}

	async getStats(): Promise<Record<string, number>> {
		const result = await this.dataSource.query(`
			SELECT
				(SELECT COUNT(*)::int FROM identity.users WHERE deleted_at IS NULL) AS "totalUsers",
				(SELECT COUNT(*)::int FROM identity.users WHERE created_at::date = CURRENT_DATE) AS "newUsersToday",
				(SELECT COUNT(*)::int FROM content.posts WHERE deleted_at IS NULL AND is_draft = false) AS "totalPosts",
				(SELECT COUNT(*)::int FROM agriculture.products WHERE deleted_at IS NULL) AS "totalProducts",
				(SELECT COUNT(*)::int FROM agriculture.public_trace_tokens) AS "totalQrGenerated",
				COALESCE((SELECT SUM(scan_count)::int FROM agriculture.public_trace_tokens), 0) AS "totalQrScans"
		`);

		return result[0];
	}

	async getActiveUserStats(): Promise<{
		dau: number;
		wau: number;
		mau: number;
	}> {
		const [row] = await this.dataSource.query<
			[{ dau: number; wau: number; mau: number }]
		>(`
			SELECT
				COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '1 day'  THEN id END)::int AS dau,
				COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '7 days' THEN id END)::int AS wau,
				COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN id END)::int AS mau
			FROM identity.users
			WHERE deleted_at IS NULL
		`);
		return row;
	}

	async getQrScanTimeSeries(
		granularity: 'day' | 'week' | 'month',
		days: number,
	): Promise<Array<{ period: string; scans: number }>> {
		const trunc =
			granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';
		return this.dataSource.query(
			`SELECT
				DATE_TRUNC($1, qs.scanned_at)::date::text AS period,
				COUNT(*)::int                              AS scans
			FROM agriculture.qr_scans qs
			WHERE qs.scanned_at >= NOW() - ($2 * INTERVAL '1 day')
			GROUP BY 1
			ORDER BY 1 ASC`,
			[trunc, days],
		);
	}

	async getTopActiveUsers(): Promise<
		Array<{
			userId: string;
			username: string;
			displayName: string | null;
			activityScore: number;
		}>
	> {
		return this.dataSource.query(`
			SELECT
				u.id           AS "userId",
				u.username     AS username,
				p.display_name AS "displayName",
				(
					(SELECT COUNT(*) FROM content.posts      WHERE author_id = u.id AND deleted_at IS NULL AND is_draft = false) * 3 +
					(SELECT COUNT(*) FROM engagement.reactions WHERE user_id    = u.id) +
					(SELECT COUNT(*) FROM engagement.comments  WHERE author_id  = u.id AND deleted_at IS NULL)
				)::int         AS "activityScore"
			FROM identity.users u
			LEFT JOIN identity.profiles p ON p.user_id = u.id
			WHERE u.deleted_at IS NULL AND u.status = 'active'
			ORDER BY "activityScore" DESC
			LIMIT 10
		`);
	}

	async getUsersByProvince(): Promise<
		Array<{ province: string; count: number }>
	> {
		return this.dataSource.query(`
			SELECT
				COALESCE(p.province, 'Chưa cập nhật') AS province,
				COUNT(*)::int                          AS count
			FROM identity.users u
			LEFT JOIN identity.profiles p ON p.user_id = u.id
			WHERE u.deleted_at IS NULL
			GROUP BY p.province
			ORDER BY count DESC
		`);
	}

	async getTopProducts(): Promise<
		Array<{ productId: string; name: string; totalScans: number }>
	> {
		// TypeORM QueryBuilder treats "schema.table" as "alias.relation" — use
		// raw SQL instead, consistent with getStats() above.
		return this.dataSource.query(`
			SELECT
				p.id          AS "productId",
				p.name        AS "name",
				COALESCE(SUM(ptt.scan_count)::int, 0) AS "totalScans"
			FROM   agriculture.public_trace_tokens ptt
			INNER JOIN agriculture.batches  b ON b.id = ptt.batch_id
			INNER JOIN agriculture.products p ON p.id = b.product_id
			GROUP  BY p.id, p.name
			ORDER  BY SUM(ptt.scan_count) DESC
			LIMIT  10
		`);
	}

	async listAppVersions(): Promise<AppVersion[]> {
		return this.appVersionRepository.findAll({
			order: { platform: 'ASC', releasedAt: 'DESC' },
		});
	}

	async createAppVersion(
		dto: CreateAppVersionRequestDto,
		createdBy: string,
	): Promise<AppVersion> {
		await this.dataSource
			.createQueryBuilder()
			.insert()
			.into(AppVersion)
			.values({
				platform: dto.platform,
				latestVersion: dto.latestVersion,
				minVersion: dto.minVersion,
				recommendedVersion: dto.recommendedVersion ?? null,
				forceUpdate: dto.forceUpdate ?? false,
				softUpdate: dto.softUpdate ?? false,
				storeUrlIos: dto.storeUrlIos ?? null,
				storeUrlAndroid: dto.storeUrlAndroid ?? null,
				releaseNotesVi: dto.releaseNotesVi ?? null,
				releaseNotesEn: dto.releaseNotesEn ?? null,
				createdBy,
			})
			.orUpdate(
				[
					'min_version',
					'recommended_version',
					'force_update',
					'soft_update',
					'store_url_ios',
					'store_url_android',
					'release_notes_vi',
					'release_notes_en',
				],
				['platform', 'latest_version'],
			)
			.execute();

		const record = await this.appVersionRepository.findOne({
			platform: dto.platform,
			latestVersion: dto.latestVersion,
		});
		if (!record) {
			throw new HttpNotFoundError(ErrorCode.APP_VERSION_NOT_FOUND);
		}

		return record;
	}

	async updateAppVersion(
		id: string,
		dto: UpdateAppVersionRequestDto,
	): Promise<AppVersion> {
		const existing = await this.appVersionRepository.findById(id);
		if (!existing) {
			throw new HttpNotFoundError(ErrorCode.APP_VERSION_NOT_FOUND);
		}

		const updated = await this.appVersionRepository.update(id, dto);
		if (!updated) {
			throw new HttpNotFoundError(ErrorCode.APP_VERSION_NOT_FOUND);
		}

		return updated;
	}
}
