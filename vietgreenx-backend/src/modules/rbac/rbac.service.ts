import {
	RbacPermission,
	RbacRole,
	RbacRolePermission,
} from '@app/database/typeorm/entities';
import { RedisService } from '@app/services/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';

@Injectable()
export class RbacService {
	private readonly CACHE_KEY = 'rbac:role';
	private readonly CACHE_TTL_SECONDS = 86400;

	constructor(
		@InjectEntityManager()
		private readonly entityManager: EntityManager,
		private readonly redisService: RedisService,
	) {}

	async getPermissionsForRole(roleName: string): Promise<string[]> {
		const cacheKey = `${this.CACHE_KEY}:${roleName}`;

		const cached = await this.redisService.get(cacheKey);

		if (cached) {
			return JSON.parse(cached);
		}

		const role = await this.entityManager.findOne(RbacRole, {
			where: { name: roleName },
		});

		if (!role) return [];

		const rolePermissions = await this.entityManager.find(RbacRolePermission, {
			where: { roleId: role.id },
		});

		if (rolePermissions.length === 0) return [];

		const permissionIds = rolePermissions.map((rp) => rp.permissionId);

		const permissions = await this.entityManager.find(RbacPermission, {
			where: {
				id: In(permissionIds),
			},
		});

		const formattedPermissions = permissions.map(
			(p) => `${p.resource}:${p.action}`,
		);

		await this.redisService.set(
			cacheKey,
			JSON.stringify(formattedPermissions),
			this.CACHE_TTL_SECONDS,
		);

		return formattedPermissions;
	}

	async clearRoleCache(roleName: string): Promise<void> {
		await this.redisService.del(`${this.CACHE_KEY}:${roleName}`);
	}
}
