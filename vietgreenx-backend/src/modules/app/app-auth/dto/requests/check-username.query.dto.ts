import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class CheckUsernameQueryDto {
	@ApiProperty({ example: 'johndoe123' })
	@IsNotEmpty()
	@IsString()
	@MinLength(3)
	@MaxLength(30)
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message:
			'Usernames can only contain letters, numbers, and underscores (_).',
	})
	username: string;
}
