import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
} from 'class-validator';

export class UpdateProfileRequestDto {
	@ApiPropertyOptional({ example: 'John Doe' })
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	displayName?: string;

	@ApiPropertyOptional({ example: 'Tech enthusiast and software engineer' })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	bio?: string;

	@ApiPropertyOptional({
		description:
			'Media ID from POST /app/media/upload-url (purpose=avatar). Pass null to remove avatar',
		nullable: true,
	})
	@IsOptional()
	@ValidateIf((_, value) => value !== null)
	@IsUUID()
	avatarMediaId?: string | null;

	@ApiPropertyOptional({
		description:
			'Media ID from POST /app/media/upload-url (purpose=cover). Pass null to remove cover',
		nullable: true,
	})
	@IsOptional()
	@ValidateIf((_, value) => value !== null)
	@IsUUID()
	coverMediaId?: string | null;

	@ApiPropertyOptional({ example: 'https://example.com' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	website?: string;

	@ApiPropertyOptional({ example: 'Hanoi' })
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({ example: 'Cau Giay' })
	@IsOptional()
	@IsString()
	district?: string;

	@ApiPropertyOptional({ example: 'Times Square' })
	@IsOptional()
	@IsString()
	ward?: string;

	@ApiPropertyOptional({
		example: 1,
		description: 'Province code từ provinces.open-api.vn',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	provinceCode?: number;

	@ApiPropertyOptional({ example: 10 })
	@IsOptional()
	@IsInt()
	@Min(1)
	districtCode?: number;

	@ApiPropertyOptional({ example: 250 })
	@IsOptional()
	@IsInt()
	@Min(1)
	wardCode?: number;
}
