import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReportResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	reporterId: string;

	@ApiProperty()
	@Expose()
	targetType: string;

	@ApiProperty()
	@Expose()
	targetId: string;

	@ApiProperty()
	@Expose()
	reason: string;

	@ApiPropertyOptional()
	@Expose()
	details: string | null;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiPropertyOptional()
	@Expose()
	actionTaken: string | null;

	@ApiPropertyOptional()
	@Expose()
	actionNote: string | null;

	@ApiPropertyOptional()
	@Expose()
	actionedAt: Date | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	reportCount: number;
}
