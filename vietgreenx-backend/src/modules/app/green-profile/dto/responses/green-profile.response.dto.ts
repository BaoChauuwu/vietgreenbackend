import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class GreenProfilePhotoDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'https://cdn.example.com/green-profiles/photo.jpg' })
	@Expose()
	cdnUrl: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	thumbnailUrl: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	widthPx: number | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	heightPx: number | null;

	@ApiProperty({ example: 'image/jpeg' })
	@Expose()
	mimeType: string;
}

export class GreenProfileVideoDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'https://cdn.example.com/green-profiles/video.mp4' })
	@Expose()
	cdnUrl: string;

	@ApiProperty({ example: 'video/mp4' })
	@Expose()
	mimeType: string;
}

export class GreenProfileResponseDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
	@Expose()
	id: string;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174000',
		nullable: true,
	})
	@Expose()
	userId: string | null;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174000',
		nullable: true,
	})
	@Expose()
	organizationId: string | null;

	@ApiProperty({ example: 'VietGreen Agricultural Cooperative' })
	@Expose()
	profileName: string;

	@ApiProperty({ example: 'Lam Dong' })
	@Expose()
	province: string;

	@ApiPropertyOptional({ example: 'Duc Trong', nullable: true })
	@Expose()
	district: string | null;

	@ApiPropertyOptional({ example: 'Lien Nghia', nullable: true })
	@Expose()
	ward: string | null;

	@ApiPropertyOptional({ example: 'Hamlet 4, Highway 20', nullable: true })
	@Expose()
	addressDetail: string | null;

	@ApiPropertyOptional({ example: 1, nullable: true })
	@Expose()
	provinceCode: number | null;

	@ApiPropertyOptional({ example: 10, nullable: true })
	@Expose()
	districtCode: number | null;

	@ApiPropertyOptional({ example: 250, nullable: true })
	@Expose()
	wardCode: number | null;

	@ApiPropertyOptional({ example: 'VN-LD-001', nullable: true })
	@Expose()
	growingZoneCode: string | null;

	@ApiProperty({
		example: ['123e4567-e89b-12d3-a456-426614174001'],
		description: 'Array of main category UUIDs',
	})
	@Expose()
	mainCategoryIds: string[];

	@ApiPropertyOptional({ example: 12.5, nullable: true })
	@Expose()
	farmAreaHa: number | null;

	@ApiPropertyOptional({ example: 150.8, nullable: true })
	@Expose()
	annualYieldTonnes: number | null;

	@ApiPropertyOptional({ nullable: true, description: 'Avatar CDN URL' })
	@Expose()
	avatarUrl: string | null;

	@ApiProperty({
		example: ['123e4567-e89b-12d3-a456-426614174002'],
		description: 'Array of farm photo media UUIDs',
	})
	@Expose()
	photoMediaIds: string[];

	@ApiProperty({
		type: [GreenProfilePhotoDto],
		description: 'Photo media with CDN URLs',
	})
	@Expose()
	@Type(() => GreenProfilePhotoDto)
	photoMedias: GreenProfilePhotoDto[];

	@ApiProperty({
		example: ['123e4567-e89b-12d3-a456-426614174003'],
		description: 'Array of farm video media UUIDs',
	})
	@Expose()
	videoMediaIds: string[];

	@ApiProperty({
		type: [GreenProfileVideoDto],
		description: 'Video media with CDN URLs',
	})
	@Expose()
	@Type(() => GreenProfileVideoDto)
	videoMedias: GreenProfileVideoDto[];

	@ApiPropertyOptional({ example: 4.8, nullable: true })
	@Expose()
	rating: number | null;

	@ApiProperty({ example: 12 })
	@Expose()
	reviewCount: number;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	phone: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	website: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	email: string | null;

	@ApiPropertyOptional({ example: 'hop-tac-xa-vietgreen', nullable: true })
	@Expose()
	slug: string | null;

	@ApiPropertyOptional({
		example:
			'Introduction to organic agricultural products meeting VietGAP standards',
		nullable: true,
	})
	@Expose()
	metaDescription: string | null;

	@ApiProperty({ example: true })
	@Expose()
	isPublished: boolean;

	@ApiPropertyOptional({ example: 11.9404, nullable: true })
	@Expose()
	latitude: number | null;

	@ApiPropertyOptional({ example: 108.4583, nullable: true })
	@Expose()
	longitude: number | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
