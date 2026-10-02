import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMembershipTierRequestDto } from './create-membership-tier.request.dto';

export class UpdateMembershipTierRequestDto extends PartialType(
	OmitType(CreateMembershipTierRequestDto, ['plan'] as const),
) {}
