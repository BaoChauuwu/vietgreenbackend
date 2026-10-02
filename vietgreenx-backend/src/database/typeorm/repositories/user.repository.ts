import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRepository } from './base.repository';
import { User } from '../entities';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from '@app/common/enums/user-status.enum';

@Injectable()
export class UserRepository
	extends BaseRepository<User>
	implements IUserRepository
{
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly configService: ConfigService,
	) {
		super(userRepo);
	}

	async countActiveUsers(): Promise<number> {
		return this.userRepo.count({
			where: { status: UserStatus.ACTIVE },
		});
	}
}
