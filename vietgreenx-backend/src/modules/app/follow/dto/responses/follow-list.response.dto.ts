import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FollowItemResponseDto {
	@ApiProperty({ description: 'The follow relationship ID' })
	@Expose()
	followId: string;

	@ApiProperty({ description: 'ID of the user or organization' })
	@Expose()
	id: string;

	@ApiProperty({
		example: 'user',
		description: 'Type of entity: user or organization',
	})
	@Expose()
	type: 'user' | 'organization';

	@ApiProperty({ description: 'Display name or Organization name' })
	@Expose()
	displayName: string;

	@ApiProperty({ description: 'Username or Organization slug' })
	@Expose()
	username: string;

	@ApiPropertyOptional({ description: 'Avatar or Logo URL' })
	@Expose()
	avatarUrl: string | null;

	@ApiPropertyOptional({ description: 'Bio or description' })
	@Expose()
	bio: string | null;
}

export class FollowListResponseDto {
	@ApiProperty({ type: [FollowItemResponseDto] })
	@Expose()
	@Type(() => FollowItemResponseDto)
	items: FollowItemResponseDto[];

	@ApiProperty({ nullable: true, example: null })
	@Expose()
	nextCursor: string | null;

	@ApiProperty({ example: true })
	@Expose()
	hasNext: boolean;

	@ApiProperty({ example: 20 })
	@Expose()
	limit: number;
}
