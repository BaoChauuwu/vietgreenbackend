import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdminUserListItemResponseDto } from './admin-user-list-item.response.dto';

export class AdminUserDetailResponseDto extends AdminUserListItemResponseDto {
	@Expose() @ApiProperty({ nullable: true }) bio: string | null;
	@Expose() @ApiProperty() emailVerified: boolean;
	@Expose() @ApiProperty() phoneVerified: boolean;
	@Expose() @ApiProperty({ nullable: true }) signupChannel: string | null;
	@Expose() @ApiProperty() postCount: number;
	@Expose() @ApiProperty() productCount: number;
}
