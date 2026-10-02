import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class AdminCategoryResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiPropertyOptional()
	@Expose()
	parentId?: string;

	@ApiProperty()
	@Expose()
	nameVi: string;

	@ApiProperty()
	@Expose()
	nameEn: string;

	@ApiProperty()
	@Expose()
	slug: string;

	@ApiPropertyOptional()
	@Expose()
	iconUrl?: string;

	@ApiProperty()
	@Expose()
	sortOrder: number;

	@ApiProperty()
	@Expose()
	isActive: boolean;

	@ApiProperty()
	@Expose()
	productCount: number;

	@ApiPropertyOptional()
	@Expose()
	createdAt: Date;

	@ApiPropertyOptional()
	@Expose()
	updatedAt: Date;

	@ApiPropertyOptional({ type: () => AdminCategoryResponseDto })
	@Expose()
	@Type(() => AdminCategoryResponseDto)
	parent?: AdminCategoryResponseDto;
}
