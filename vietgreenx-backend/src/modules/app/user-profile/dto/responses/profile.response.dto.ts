import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
export class ProfileResponseDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
	@Expose()
	id: string;
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
	@Expose()
	userId: string;
	@ApiProperty({ example: 'John Doe' })
	@Expose()
	displayName: string;
	@ApiPropertyOptional({ example: 'Tech enthusiast and software engineer' })
	@Expose()
	bio: string | null;
	@ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
	@Expose()
	@Transform(({ obj }) => obj.avatarMedia?.cdnUrl || null)
	avatarUrl: string | null;
	@ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
	@Expose()
	@Transform(({ obj }) => obj.coverMedia?.cdnUrl || null)
	coverUrl: string | null;
	@ApiPropertyOptional({ example: 'https://example.com' })
	@Expose()
	website: string | null;
	@ApiPropertyOptional({ example: 'Hanoi' })
	@Expose()
	province: string | null;
	@ApiPropertyOptional({ example: 'Cau Giay' })
	@Expose()
	district: string | null;
	@ApiPropertyOptional({ example: 'Times Square' })
	@Expose()
	ward: string | null;
	@ApiPropertyOptional({ example: 1, nullable: true })
	@Expose()
	provinceCode: number | null;
	@ApiPropertyOptional({ example: 10, nullable: true })
	@Expose()
	districtCode: number | null;
	@ApiPropertyOptional({ example: 250, nullable: true })
	@Expose()
	wardCode: number | null;
	@ApiProperty({ example: false })
	@Expose()
	isVerified: boolean;
	@ApiProperty({ example: false })
	@Expose()
	isPrivate: boolean;
	@ApiProperty({ example: 0 })
	@Expose()
	followerCount: number;
	@ApiProperty({ example: 0 })
	@Expose()
	followingCount: number;
	@ApiProperty({ example: 0 })
	@Expose()
	postCount: number;
}
