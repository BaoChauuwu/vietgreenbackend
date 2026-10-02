import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class QrTokenResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	token: string;

	@ApiProperty({ enum: ['batch', 'product'] })
	@Expose()
	targetType: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	batchId: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	productId: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	qrImageUrl: string | null;

	@ApiProperty()
	@Expose()
	scanCount: number;

	@ApiProperty()
	@Expose()
	isActive: boolean;

	@ApiProperty()
	@Expose()
	createdBy: string;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
