import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PublicProductResponseDto } from './public-product.response.dto';
import { PublicBatchResponseDto } from './public-batch.response.dto';
import { PublicQrMilestoneSummaryResponseDto } from './public-qr-milestone-summary.response.dto';
import { TraceCertificationResponseDto } from './trace-certification.response.dto';
import { ReviewSummaryResponseDto } from './review.response.dto';
import { ProductPhotoMediaDto } from '../../../product/dto/responses/product.response.dto';

export class TraceResponseDto {
	@Expose()
	@ApiProperty({ description: 'The unique trace token UUID' })
	token: string;

	@Expose()
	@ApiProperty({
		description: 'The target type of the trace token',
		enum: ['product', 'batch'],
	})
	targetType: string;

	@Expose()
	@ApiProperty({
		type: () => PublicProductResponseDto,
		description: 'Product details associated with the trace',
	})
	@Type(() => PublicProductResponseDto)
	product: PublicProductResponseDto;

	@Expose()
	@ApiPropertyOptional({
		description: 'The slug of the producer green profile',
	})
	producerSlug: string | null;
	@Expose()
	@ApiProperty({
		type: [ProductPhotoMediaDto],
		description: 'Farm photos of the producer green profile',
	})
	@Type(() => ProductPhotoMediaDto)
	farmPhotos: ProductPhotoMediaDto[];

	@Expose()
	@ApiPropertyOptional({
		type: () => PublicBatchResponseDto,
		description: 'Batch details associated with the trace',
	})
	@Type(() => PublicBatchResponseDto)
	batch: PublicBatchResponseDto | null;

	@Expose()
	@ApiProperty({
		type: [PublicQrMilestoneSummaryResponseDto],
		description: '5-milestone production log summaries',
	})
	@Type(() => PublicQrMilestoneSummaryResponseDto)
	milestones: PublicQrMilestoneSummaryResponseDto[];

	@Expose()
	@ApiProperty({
		type: [TraceCertificationResponseDto],
		description: 'Certifications associated with the product',
	})
	@Type(() => TraceCertificationResponseDto)
	certifications: TraceCertificationResponseDto[];

	@Expose()
	@ApiProperty({ type: ReviewSummaryResponseDto })
	@Type(() => ReviewSummaryResponseDto)
	reviews: ReviewSummaryResponseDto;
}
