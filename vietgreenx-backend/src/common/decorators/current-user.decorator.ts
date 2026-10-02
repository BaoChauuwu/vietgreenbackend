import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@app/database/typeorm/entities/identity/user.entity';

export const CurrentUser = createParamDecorator(
	(data: string, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest<{ user: User }>();
		const user = request.user;
		return data ? user && user[data as keyof User] : user;
	},
);
