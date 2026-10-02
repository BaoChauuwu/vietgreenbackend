import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReactionType } from '@app/common/enums/reaction-type.enum';

export class ReactionUserItemDto {
	@ApiProperty({ example: '019eab62-...' })
	@Expose()
	userId: string;

	@ApiProperty({ example: 'Nguyễn Văn A' })
	@Expose()
	displayName: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	avatarUrl: string | null;

	@ApiProperty({ enum: ReactionType })
	@Expose()
	reaction: ReactionType;
}
