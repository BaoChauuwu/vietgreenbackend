import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';

export const users = [
	{
		username: 'admin',
		email: 'admin@vietgreenx.vn',
		phone: '0900000001',
		password: '123qwe!@#',
		role: UserRole.ADMIN,
		status: UserStatus.ACTIVE,
	},
];
