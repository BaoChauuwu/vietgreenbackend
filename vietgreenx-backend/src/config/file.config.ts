import { registerAs } from '@nestjs/config';

import { IsEnum, IsOptional, IsString } from 'class-validator';
import validateConfig from '@app/utils/validate-config';

export enum FileDriver {
	LOCAL = 'local',
	S3 = 's3',
	S3_PRESIGNED = 's3-presigned',
}

export type FileConfig = {
	driver: FileDriver;
	accessKeyId?: string;
	secretAccessKey?: string;
	awsDefaultS3Bucket?: string;
	awsS3Region?: string;
	awsDefaultS3Url?: string;
	maxFileSize: number;
};

class EnvironmentVariablesValidator {
	@IsEnum(FileDriver)
	FILE_DRIVER: FileDriver;

	@IsString()
	@IsOptional()
	ACCESS_KEY_ID: string;

	@IsString()
	@IsOptional()
	SECRET_ACCESS_KEY: string;

	@IsString()
	AWS_DEFAULT_S3_BUCKET: string;

	@IsString()
	AWS_S3_REGION: string;

	@IsString()
	AWS_DEFAULT_S3_URL: string;
}

export default registerAs<FileConfig>('file', () => {
	validateConfig(process.env, EnvironmentVariablesValidator);

	return {
		driver:
			(process.env['FILE_DRIVER'] as FileDriver | undefined) ??
			FileDriver.LOCAL,
		accessKeyId: process.env['ACCESS_KEY_ID'] || '',
		secretAccessKey: process.env['SECRET_ACCESS_KEY'] || '',
		awsDefaultS3Bucket: process.env['AWS_DEFAULT_S3_BUCKET'] || '',
		awsS3Region: process.env['AWS_S3_REGION'] || '',
		awsDefaultS3Url: process.env['AWS_DEFAULT_S3_URL'] || '',
		maxFileSize: 5242880, // 5mb
	};
});
