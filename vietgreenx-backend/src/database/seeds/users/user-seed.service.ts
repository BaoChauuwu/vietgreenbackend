import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities';
import { users } from '@app/database/data/users';

@Injectable()
export class UserSeedService {
	constructor(
		@InjectRepository(User) private UsersRepository: Repository<User>,
	) {}

	async run(): Promise<void> {
		await this.fakeUsers();
		console.log('✅Users seeded successfully');
	}

	private async fakeUsers(): Promise<void> {
		for (const user of users) {
			const existingByEmail = await this.UsersRepository.findOne({
				where: { email: user.email },
			});
			if (existingByEmail) {
				continue;
			}

			if (user.phone) {
				const existingByPhone = await this.UsersRepository.findOne({
					where: { phone: user.phone },
				});
				if (existingByPhone) {
					continue;
				}
			}
			const hashedPassword = await bcrypt.hash(user.password, 10);
			const newUser = await this.UsersRepository.create({
				...user,
				passwordHash: hashedPassword,
			});
			await this.UsersRepository.save(newUser);
		}
	}
}
