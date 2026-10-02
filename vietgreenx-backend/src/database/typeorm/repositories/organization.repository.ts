import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities';

@Injectable()
export class OrganizationRepository extends BaseRepository<Organization> {
	constructor(
		@InjectRepository(Organization)
		private readonly repo: Repository<Organization>,
	) {
		super(repo);
	}

	async findActiveWithMemberCount(
		page: number,
		limit: number,
	): Promise<{
		items: (Organization & { memberCount: number })[];
		total: number;
		page: number;
		limit: number;
		totalPage: number;
	}> {
		page = Math.max(1, Math.floor(page));
		limit = Math.max(1, Math.min(Math.floor(limit), 1000));
		const skip = (page - 1) * limit;

		const { entities, raw } = await this.repo
			.createQueryBuilder('org')
			.leftJoinAndSelect('org.logoMedia', 'logoMedia')
			.leftJoinAndSelect('org.coverMedia', 'coverMedia')
			.addSelect(
				(sub) =>
					sub
						.select('COUNT(*)', 'cnt')
						.from('identity.organization_members', 'om')
						.where('om.organization_id = org.id')
						.andWhere("om.status = 'active'"),
				'memberCount',
			)
			.where('org.isActive = true')
			.orderBy('org.createdAt', 'DESC')
			.skip(skip)
			.take(limit)
			.getRawAndEntities();

		const total = await this.repo.count({ where: { isActive: true } });

		const countById = new Map<string, number>(
			raw.map((r) => [r.org_id as string, parseInt(r.memberCount ?? '0', 10)]),
		);

		const items = entities.map((org) => {
			(org as Organization & { memberCount: number }).memberCount =
				countById.get(org.id) ?? 0;
			return org as Organization & { memberCount: number };
		});

		return { items, total, page, limit, totalPage: Math.ceil(total / limit) };
	}
}
