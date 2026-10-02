import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';

@Exclude()
export class AdminProfileResponseDto {
	@Expose()
	id: string;

	@Expose()
	email: string;

	@Expose()
	firstName: string;

	@Expose()
	lastName: string;

	@Expose()
	phone: string;

	@Expose()
	avatar: string;

	@Expose()
	role: UserRole;

	@Expose()
	status: UserStatus;
}
