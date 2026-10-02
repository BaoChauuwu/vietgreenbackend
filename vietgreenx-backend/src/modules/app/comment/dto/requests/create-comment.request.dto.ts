import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateCommentRequestDto {
	@ApiProperty({
		example: '019eab62-7e34-767a-b81a-98b10f113440',
		description: 'ID of the post',
	})
	@IsNotEmpty()
	@IsUUID()
	postId: string;

	@ApiPropertyOptional({
		example: '019eab62-7e34-767a-b81a-98b10f113440',
		description: 'ID of the parent comment if it is a reply',
	})
	@IsOptional()
	@IsUUID()
	parentCommentId?: string;

	@ApiProperty({
		example: 'This is a comment.',
		description: 'Comment content',
	})
	@IsNotEmpty()
	@Length(1, 500)
	body: string;
}
