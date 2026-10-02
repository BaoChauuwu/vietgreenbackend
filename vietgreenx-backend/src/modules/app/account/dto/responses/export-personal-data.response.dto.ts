import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ExportPersonalDataResponseDto {
	@ApiProperty({ example: 'personal_data_feed_consumer.csv' })
	@Expose()
	fileName: string;

	@ApiProperty()
	@Expose()
	fileUrl: string;

	@ApiProperty({ example: '900 seconds' })
	@Expose()
	expiresIn: string;
}
