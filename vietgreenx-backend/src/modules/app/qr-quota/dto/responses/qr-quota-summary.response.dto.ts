import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class QrQuotaSummaryResponseDto {
	@Expose()
	billingPeriod: string;

	@Expose()
	qrLimit: number;

	@Expose()
	extraQuota: number;

	@Expose()
	qrGenerated: number;

	@Expose()
	totalAllowed: number;

	@Expose()
	remaining: number;
}
