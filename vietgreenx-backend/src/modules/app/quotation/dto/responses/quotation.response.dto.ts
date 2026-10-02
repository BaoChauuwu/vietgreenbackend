import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class QuotationUserDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() username: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) displayName: string | null;
	@Expose() @ApiPropertyOptional({ nullable: true }) avatarUrl: string | null;
}

export class QuotationResponseDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) tradePostId: string | null;
	@Expose() @ApiPropertyOptional({ nullable: true }) productId: string | null;
	@Expose() @ApiProperty() offeredPrice: number;
	@Expose() @ApiProperty() priceUnit: string;
	@Expose() @ApiProperty() quantity: number;
	@Expose() @ApiProperty() quantityUnit: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) deliveryTerms:
		| string
		| null;
	@Expose() @ApiPropertyOptional({ nullable: true }) notes: string | null;
	@Expose() @ApiProperty() status: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) rejectionNote:
		| string
		| null;
	@Expose() @ApiPropertyOptional({ nullable: true }) acceptedAt: Date | null;
	@Expose() @ApiPropertyOptional({ nullable: true }) rejectedAt: Date | null;
	@Expose() @ApiProperty() validUntil: string;
	@Expose() @ApiProperty() expiresAt: Date;
	@Expose() @ApiProperty() createdAt: Date;

	@Expose()
	@ApiProperty({ type: QuotationUserDto })
	@Type(() => QuotationUserDto)
	sender: QuotationUserDto;

	@Expose()
	@ApiProperty({ type: QuotationUserDto })
	@Type(() => QuotationUserDto)
	receiver: QuotationUserDto;
}
