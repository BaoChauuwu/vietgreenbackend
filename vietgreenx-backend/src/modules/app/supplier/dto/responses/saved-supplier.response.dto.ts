import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class SavedSupplierUserDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() username: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) displayName: string | null;
	@Expose() @ApiPropertyOptional({ nullable: true }) avatarUrl: string | null;
}

export class SavedSupplierResponseDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() createdAt: Date;

	@Expose()
	@ApiProperty({ type: SavedSupplierUserDto })
	@Type(() => SavedSupplierUserDto)
	supplier: SavedSupplierUserDto;
}
