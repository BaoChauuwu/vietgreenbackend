import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NotificationResponseDto } from './notification.response.dto';

export class NotificationsResponseDto {
	@ApiProperty({
		type: [NotificationResponseDto],
		description: 'List of notifications',
	})
	@Expose()
	@Type(() => NotificationResponseDto)
	items: NotificationResponseDto[];

	@ApiProperty({
		nullable: true,
		description: 'Cursor to query the next page of notifications',
		example:
			'eyJ2YWx1ZXMiOlsiMjAyNi0wNi0yMlQwNDoyNTowMC4wMDBaIiwiMDE5ZWFiNjItN2UzNC03NjdhLWI4MWEtOThiMTBmMTEzNDQwIl19',
	})
	@Expose()
	nextCursor: string | null;

	@ApiProperty({
		description: 'Indicates if there is a next page',
		example: true,
	})
	@Expose()
	hasNext: boolean;

	@ApiProperty({
		description: 'Number of items per page',
		example: 20,
	})
	@Expose()
	limit: number;
}
