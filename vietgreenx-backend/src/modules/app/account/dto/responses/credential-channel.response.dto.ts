import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CredentialChannelResponseDto {
	@ApiProperty({ example: true })
	@Expose()
	present: boolean;

	@ApiProperty({ example: true })
	@Expose()
	verified: boolean;

	@ApiPropertyOptional({
		nullable: true,
		example: 'bis***@gmail.com',
		description: 'Masked value; null when present is false',
	})
	@Expose()
	masked: string | null;
}
