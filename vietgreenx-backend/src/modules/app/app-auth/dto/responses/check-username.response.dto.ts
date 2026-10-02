import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CheckUsernameResponseDto {
	@ApiProperty({ example: true })
	@Expose()
	available: boolean;
}
