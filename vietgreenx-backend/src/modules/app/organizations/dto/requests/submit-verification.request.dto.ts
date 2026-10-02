import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitVerificationRequestDto {
	@ApiProperty({
		description: 'Type of document',
		example: 'business_registration',
	})
	@IsNotEmpty()
	@IsString()
	documentType: string;

	@ApiProperty({
		description: 'Link to the front side of the document',
		example: 'https://cdn.vietgreenx.com/abc.jpg',
	})
	@IsNotEmpty()
	@IsUrl()
	documentFrontUrl: string;

	@ApiPropertyOptional({
		description: 'Link to the back side of the document (if applicable)',
	})
	@IsOptional()
	@IsUrl()
	documentBackUrl?: string;

	@ApiPropertyOptional({
		description: 'Additional documents for verification',
		type: [Object],
	})
	@IsOptional()
	additionalDocs?: object[];
}
