import { CommentSort } from '@app/common/enums/comment-sort.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
} from 'class-validator';

export class GetCommentsQueryRequestDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@IsNotEmpty()
	@IsUUID()
	postId: string;

	@ApiPropertyOptional({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@IsOptional()
	@IsUUID()
	parentCommentId?: string;

	@ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number = 20;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	cursor?: string;

	@ApiPropertyOptional({ enum: CommentSort })
	@IsOptional()
	@IsEnum(CommentSort)
	sort?: CommentSort;
}
