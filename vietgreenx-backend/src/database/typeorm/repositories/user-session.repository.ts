import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { UserSession } from '../entities/identity/user-session.entity';

@Injectable()
export class UserSessionRepository extends BaseRepository<UserSession> {
	constructor(
		@InjectRepository(UserSession)
		private readonly sessionRepo: Repository<UserSession>,
	) {
		super(sessionRepo);
	}
}
