import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { PaginationDto } from '@app/common/dtos/paginationDto';

export class ListCertificationsQueryDto extends PaginationDto {
	@ApiPropertyOptional({
		enum: CertificationStatus,
		default: CertificationStatus.PENDING,
	})
	@IsOptional()
	@IsEnum(CertificationStatus)
	status?: CertificationStatus;

	@ApiPropertyOptional({ description: 'Filter by green profile' })
	@IsOptional()
	@IsUUID()
	greenProfileId?: string;
}
