import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSearchItemResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty({ example: 'hieuchau' })
	@Expose()
	username: string;

	@ApiPropertyOptional({ example: 'Hieu Chau', nullable: true })
	@Expose()
	displayName: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	avatarUrl: string | null;
}
