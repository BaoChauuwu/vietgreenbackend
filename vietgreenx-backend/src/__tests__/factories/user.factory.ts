import { faker } from '@faker-js/faker';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';

export function createUser(overrides: Partial<User> = {}): User {
	return {
		id: faker.string.uuid(),
		email: faker.internet.email(),
		phone: faker.phone.number({ style: 'international' }),
		username: faker.internet.username(),
		passwordHash: '$2b$10$hashedpassword',
		role: UserRole.CONSUMER,
		status: UserStatus.ACTIVE,
		version: 0,
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
		deletedAt: null,
		...overrides,
	} as User;
}
