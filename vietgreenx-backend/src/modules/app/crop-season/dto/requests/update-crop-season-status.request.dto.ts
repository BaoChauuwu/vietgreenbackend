import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SeasonStatus } from '@app/common/enums/season-status.enum';

export class UpdateCropSeasonStatusRequestDto {
	@ApiProperty({
		description: 'New status for the crop season',
		enum: SeasonStatus,
		example: SeasonStatus.ACTIVE,
	})
	@IsNotEmpty()
	@IsEnum(SeasonStatus)
	status: SeasonStatus;
}
