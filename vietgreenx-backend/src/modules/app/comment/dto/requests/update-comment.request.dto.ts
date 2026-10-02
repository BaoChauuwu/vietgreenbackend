import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class UpdateCommentRequestDto {
	@ApiProperty({
		example: 'This is an edited comment.',
		description: 'Updated comment content',
	})
	@IsNotEmpty()
	@Length(1, 500)
	body: string;
}
