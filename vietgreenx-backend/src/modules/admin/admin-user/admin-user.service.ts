import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { Profile, User } from '@app/database/typeorm/entities';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { AppAuthService } from '../../app/app-auth/app-auth.service';
import { Pagination } from '@app/common/types/request-response.type';
import { AdminUserListQueryDto } from './dto/requests/admin-user-list-query.request.dto';
import {
	AdminUserVerifyRequestDto,
	VerifyAction,
} from './dto/requests/admin-user-verify.request.dto';
import { NotifType } from '@app/common/enums/notif-type.enum';

const REVOKE_ON_STATUS: UserStatus[] = [
	UserStatus.SUSPENDED,
	UserStatus.BANNED,
];

@Injectable()
export class AdminUserService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly notificationRepository: NotificationRepository,
		private readonly appAuthService: AppAuthService,
		@InjectDataSource() private readonly dataSource: DataSource,
	) {}

	private buildUserListQb(
		query: AdminUserListQueryDto,
	): SelectQueryBuilder<object> {
		const { q, role, status, province, fromDate, toDate } = query;

		const qb = this.dataSource
			.createQueryBuilder()
			.select([
				'u.id                   AS id',
				'u.username             AS username',
				'u.email                AS email',
				'u.phone                AS phone',
				'u.role                 AS role',
				'u.status               AS status',
				'u.verification_level   AS "verificationLevel"',
				'u.plan                 AS plan',
				'u.last_login_at        AS "lastLoginAt"',
				'u.created_at           AS "createdAt"',
				'p.display_name         AS "displayName"',
				'p.province             AS province',
			])
			.from('identity.users', 'u')
			.leftJoin(Profile, 'p', 'p.user_id = u.id')
			.where('u.deleted_at IS NULL');

		if (q) {
			const term = `%${q.trim().replace(/[\\%_]/g, '\\$&')}%`;
			qb.andWhere(
				"(u.username ILIKE :term ESCAPE '\\' OR u.email ILIKE :term ESCAPE '\\' OR u.phone ILIKE :term ESCAPE '\\')",
				{ term },
			);
		}
		if (role) qb.andWhere('u.role = :role', { role });
		if (status) qb.andWhere('u.status = :status', { status });
		if (province)
			qb.andWhere('LOWER(p.province) = LOWER(:province)', { province });
		if (fromDate) qb.andWhere('u.created_at >= :fromDate', { fromDate });
		// Include the entire toDate day by shifting the upper bound to the next day's midnight.
		if (toDate)
			qb.andWhere("u.created_at < (:toDate::date + INTERVAL '1 day')", {
				toDate,
			});

		return qb;
	}

	async listUsers(
		query: AdminUserListQueryDto,
	): Promise<Pagination<Record<string, unknown>>> {
		const { page, limit, sortBy, sortOrder } = query;
		const offset = (page - 1) * limit;
		const qb = this.buildUserListQb(query);

		const total = await qb.getCount();

		const validSortFields = ['username', 'role', 'status', 'createdAt'];
		let sortColumn = 'u.created_at';
		if (sortBy && validSortFields.includes(sortBy)) {
			sortColumn = sortBy === 'createdAt' ? 'u.created_at' : `u.${sortBy}`;
		}

		const items = await qb
			.orderBy(sortColumn, sortOrder === 'ASC' ? 'ASC' : 'DESC')
			.limit(limit)
			.offset(offset)
			.getRawMany<Record<string, unknown>>();

		return { page, limit, total, totalPage: Math.ceil(total / limit), items };
	}

	async getUserDetail(id: string): Promise<Record<string, unknown>> {
		const rows = await this.dataSource.query<Record<string, unknown>[]>(
			`SELECT
				u.id,
				u.username,
				u.email,
				u.phone,
				u.role,
				u.status,
				u.verification_level   AS "verificationLevel",
				u.plan,
				u.last_login_at        AS "lastLoginAt",
				u.created_at           AS "createdAt",
				u.email_verified       AS "emailVerified",
				u.phone_verified       AS "phoneVerified",
				u.signup_channel       AS "signupChannel",
				p.display_name         AS "displayName",
				p.bio,
				p.province,
				(SELECT COUNT(*)::int FROM content.posts   WHERE author_id   = u.id AND deleted_at IS NULL AND is_draft = false) AS "postCount",
				(SELECT COUNT(*)::int FROM agriculture.products WHERE owner_user_id = u.id AND deleted_at IS NULL)               AS "productCount"
			FROM identity.users    u
			LEFT JOIN identity.profiles p ON p.user_id = u.id
			WHERE u.id = $1 AND u.deleted_at IS NULL`,
			[id],
		);

		if (!rows.length) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		return rows[0];
	}

	async changeUserRole(
		id: string,
		newRole: UserRole,
		adminId: string,
	): Promise<null> {
		const user = await this.userRepository.findOne({ id });
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.id === adminId)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_ACT_ON_SELF);
		if (user.role === UserRole.ADMIN)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_CHANGE_ROLE_OF_ADMIN);
		if (newRole === UserRole.ADMIN)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_ASSIGN_ADMIN_ROLE);
		if (user.status !== UserStatus.ACTIVE)
			throw new HttpBadRequestError(ErrorCode.USER_IN_ACTIVE);

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ role: newRole, version: () => 'version + 1' })
				.where('id = :id', { id })
				.execute();
		});

		await this.appAuthService.revokeAllSessions(id);
		return null;
	}

	async changeUserStatus(
		id: string,
		newStatus: UserStatus,
		adminId: string,
	): Promise<null> {
		const user = await this.userRepository.findOne({ id });
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.id === adminId)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_ACT_ON_SELF);
		if (user.status === UserStatus.PURGED)
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ status: newStatus, version: () => 'version + 1' })
				.where('id = :id', { id })
				.execute();
		});

		if (REVOKE_ON_STATUS.includes(newStatus)) {
			await this.appAuthService.revokeAllSessions(id);
		}

		return null;
	}

	async softDeleteUser(id: string, adminId: string): Promise<null> {
		const user = await this.userRepository.findOne({ id });
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.id === adminId)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_ACT_ON_SELF);

		await this.appAuthService.revokeAllSessions(id);
		await this.userRepository.softDelete(id);
		return null;
	}

	async verifyUser(
		id: string,
		adminId: string,
		dto: AdminUserVerifyRequestDto,
	): Promise<null> {
		const user = await this.userRepository.findOne({ id });
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.id === adminId)
			throw new HttpForbiddenError(ErrorCode.ADMIN_CANNOT_ACT_ON_SELF);

		if (dto.action === VerifyAction.APPROVE) {
			const level = dto.level ?? VerificationLevel.BASIC;
			await this.dataSource
				.createQueryBuilder()
				.update(User)
				.set({ verificationLevel: level, version: () => 'version + 1' })
				.where('id = :id', { id })
				.execute();

			await this.notificationRepository.create({
				recipientId: id,
				actorId: adminId,
				notifType: NotifType.VERIFICATION_APPROVED,
				title: 'Tài khoản đã được xác minh',
				body: `Tài khoản của bạn đã được xác minh ở mức ${level}.`,
				entityId: id,
				entityType: 'user',
				isRead: false,
			});
		} else {
			await this.dataSource
				.createQueryBuilder()
				.update(User)
				.set({
					verificationLevel: VerificationLevel.UNVERIFIED,
					version: () => 'version + 1',
				})
				.where('id = :id', { id })
				.execute();

			await this.notificationRepository.create({
				recipientId: id,
				actorId: adminId,
				notifType: NotifType.VERIFICATION_REJECTED,
				title: 'Xác minh tài khoản bị từ chối',
				body: dto.reason
					? `Lý do: ${dto.reason}`
					: 'Vui lòng cập nhật thông tin và thử lại.',
				entityId: id,
				entityType: 'user',
				isRead: false,
			});
		}

		return null;
	}

	async exportUsersCsv(query: AdminUserListQueryDto): Promise<string> {
		const rows = await this.buildUserListQb(query)
			.orderBy('u.created_at', 'DESC')
			.getRawMany<Record<string, unknown>>();

		const HEADERS = [
			'id',
			'username',
			'email',
			'phone',
			'role',
			'status',
			'verificationLevel',
			'plan',
			'displayName',
			'province',
			'createdAt',
			'lastLoginAt',
		];

		const escape = (v: unknown): string => {
			const s = v == null ? '' : String(v);
			// OWASP CSV injection prevention: prefix formula-trigger characters.
			const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s;
			return safe.includes(',') ||
				safe.includes('"') ||
				safe.includes('\n') ||
				safe.includes('\r')
				? `"${safe.replace(/"/g, '""')}"`
				: safe;
		};

		const lines = [
			HEADERS.join(','),
			...rows.map((row) => HEADERS.map((h) => escape(row[h])).join(',')),
		];

		return lines.join('\r\n');
	}
}
