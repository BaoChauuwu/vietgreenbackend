import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CategoryParentResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	nameVi: string;

	@ApiProperty()
	@Expose()
	nameEn: string;

	@ApiProperty()
	@Expose()
	slug: string;
}

export class CategoryResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	nameVi: string;

	@ApiProperty()
	@Expose()
	nameEn: string;

	@ApiProperty()
	@Expose()
	slug: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	iconUrl: string | null;

	@ApiProperty()
	@Expose()
	sortOrder: number;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	parentId: string | null;

	@ApiPropertyOptional({
		type: () => CategoryParentResponseDto,
		nullable: true,
	})
	@Expose()
	@Type(() => CategoryParentResponseDto)
	parent: CategoryParentResponseDto | null;
}
