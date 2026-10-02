import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuditLogResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	action: string;

	@ApiPropertyOptional()
	@Expose()
	userId: string | null;

	@ApiPropertyOptional()
	@Expose()
	actorRole: string | null;

	@ApiPropertyOptional()
	@Expose()
	ipAddress: string | null;

	@ApiProperty()
	@Expose()
	metadata: Record<string, unknown>;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}
