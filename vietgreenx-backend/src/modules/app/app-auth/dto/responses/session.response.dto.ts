import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SessionResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty({ nullable: true })
	@Expose()
	deviceName: string | null;

	@ApiProperty({ nullable: true })
	@Expose()
	platform: string | null;

	@ApiProperty({ nullable: true })
	@Expose()
	ipAddress: string | null;

	@ApiProperty({ nullable: true })
	@Expose()
	lastUsedAt: Date | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	isCurrent: boolean;
}
