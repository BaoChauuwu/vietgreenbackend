import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CheckOtpResponseDto {
	@ApiProperty({ example: true })
	@Expose()
	valid: boolean;
}
