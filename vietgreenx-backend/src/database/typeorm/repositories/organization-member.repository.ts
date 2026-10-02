import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember } from '../entities';

@Injectable()
export class OrganizationMemberRepository extends BaseRepository<OrganizationMember> {
	constructor(
		@InjectRepository(OrganizationMember)
		private readonly repo: Repository<OrganizationMember>,
	) {
		super(repo);
	}
}
