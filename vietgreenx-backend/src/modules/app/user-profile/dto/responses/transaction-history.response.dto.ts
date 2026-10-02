import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class TransactionPartnerDto {
	@ApiProperty()
	@Expose()
	userId: string;

	@ApiPropertyOptional()
	@Expose()
	displayName: string | null;

	@ApiPropertyOptional()
	@Expose()
	avatarUrl: string | null;
}

export class TransactionHistoryItemDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty({ description: 'sent | received' })
	@Expose()
	direction: 'sent' | 'received';

	@ApiProperty()
	@Expose()
	status: string;

	@ApiPropertyOptional()
	@Expose()
	productId: string | null;

	@ApiPropertyOptional()
	@Expose()
	productName: string | null;

	@ApiProperty()
	@Expose()
	quantity: number;

	@ApiProperty()
	@Expose()
	quantityUnit: string;

	@ApiProperty()
	@Expose()
	validUntil: string;

	@ApiProperty()
	@Expose()
	@Type(() => TransactionPartnerDto)
	partner: TransactionPartnerDto;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}

export class TransactionHistoryResponseDto {
	@ApiProperty({ type: [TransactionHistoryItemDto] })
	@Expose()
	@Type(() => TransactionHistoryItemDto)
	items: TransactionHistoryItemDto[];

	@ApiProperty()
	@Expose()
	total: number;

	@ApiProperty()
	@Expose()
	page: number;

	@ApiProperty()
	@Expose()
	limit: number;

	@ApiProperty()
	@Expose()
	totalPage: number;
}
