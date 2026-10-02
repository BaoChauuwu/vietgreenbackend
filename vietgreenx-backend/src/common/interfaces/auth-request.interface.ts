import { Request } from 'express';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';

export interface AuthRequest extends Request {
	user: User;
}

export interface TokenPayload {
	id: string;
	email: string;
	role: UserRole;
	status: UserStatus;
}
