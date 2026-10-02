import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/common/enums/user-role.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

export class AdminUserListItemResponseDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() username: string;
	@Expose() @ApiProperty({ nullable: true }) email: string | null;
	@Expose() @ApiProperty({ nullable: true }) phone: string | null;
	@Expose() @ApiProperty({ enum: UserRole }) role: UserRole;
	@Expose() @ApiProperty({ enum: UserStatus }) status: UserStatus;
	@Expose()
	@ApiProperty({ enum: VerificationLevel })
	verificationLevel: VerificationLevel;
	@Expose() @ApiProperty({ enum: MembershipPlan }) plan: MembershipPlan;
	@Expose() @ApiProperty({ nullable: true }) displayName: string | null;
	@Expose() @ApiProperty({ nullable: true }) province: string | null;
	@Expose() @ApiProperty() createdAt: Date;
	@Expose() @ApiProperty({ nullable: true }) lastLoginAt: Date | null;
}
