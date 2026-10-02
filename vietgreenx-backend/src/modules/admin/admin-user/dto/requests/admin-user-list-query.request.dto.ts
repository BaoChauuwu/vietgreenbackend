import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';

export class AdminUserListQueryDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Search by username, email, or phone' })
	@IsOptional()
	@IsString()
	q?: string;

	@ApiPropertyOptional({ enum: UserRole })
	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;

	@ApiPropertyOptional({ enum: UserStatus })
	@IsOptional()
	@IsEnum(UserStatus)
	status?: UserStatus;

	@ApiPropertyOptional({ description: 'Filter by province (exact match)' })
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({ description: 'Registration date from (ISO 8601)' })
	@IsOptional()
	@IsDateString()
	fromDate?: string;

	@ApiPropertyOptional({ description: 'Registration date to (ISO 8601)' })
	@IsOptional()
	@IsDateString()
	toDate?: string;
}
