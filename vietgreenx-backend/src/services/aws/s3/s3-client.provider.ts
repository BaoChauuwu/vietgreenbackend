import { ConfigKeys } from '@app/config/config-key.enum';
import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3ClientProvider {
	public readonly client: S3Client;

	constructor(private readonly configService: ConfigService) {
		const region = this.configService.get(ConfigKeys.AWS_S3_REGION);
		const accessKeyId = this.configService.get(ConfigKeys.ACCESS_KEY_ID);
		const secretAccessKey = this.configService.get(
			ConfigKeys.SECRET_ACCESS_KEY,
		);
		this.client = new S3Client({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			requestChecksumCalculation: 'WHEN_REQUIRED',
			responseChecksumValidation: 'WHEN_REQUIRED',
		});
	}
}
