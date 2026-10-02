import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { S3ClientProvider } from './s3-client.provider';
import { ConfigKeys } from '@app/config/config-key.enum';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
	private readonly logger = new Logger(S3Service.name);
	private readonly s3Client: S3Client;
	private readonly s3Bucket: string;
	private readonly s3Url: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly s3ClientProvider: S3ClientProvider,
	) {
		this.s3Client = this.s3ClientProvider.client;
		this.s3Bucket = this.configService.getOrThrow(
			ConfigKeys.AWS_DEFAULT_S3_BUCKET,
		);
		this.s3Url = this.configService.getOrThrow(ConfigKeys.AWS_DEFAULT_S3_URL);
		this.logger.debug('S3Service initialized');
	}

	async uploadPublicFile(
		fileName: string,
		dataBuffer: Buffer,
		mimeType: string,
	) {
		const extension = fileName.split('.').pop();
		const newFilename = `${v4()}.${extension}`;

		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.s3Bucket,
				Key: newFilename,
				Body: dataBuffer,
				ContentType: mimeType,
			}),
		);

		return {
			fileName: fileName,
			storageKey: newFilename,
			fileUrl: `${this.s3Url}/${newFilename}`,
		};
	}

	getPublicUrl(storageKey: string): string {
		return `${this.s3Url}/${storageKey}`;
	}

	async getPresignedUploadUrl(
		key: string,
		mimeType: string,
		expiresIn = 900,
	): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.s3Bucket,
			Key: key,
			ContentType: mimeType,
		});

		return getSignedUrl(this.s3Client, command, { expiresIn });
	}

	async headObject(key: string): Promise<{
		exists: boolean;
		contentLength?: number;
		contentType?: string;
	}> {
		try {
			const result = await this.s3Client.send(
				new HeadObjectCommand({
					Bucket: this.s3Bucket,
					Key: key,
				}),
			);

			return {
				exists: true,
				contentLength: result.ContentLength,
				contentType: result.ContentType,
			};
		} catch (error: unknown) {
			const status = (error as { $metadata?: { httpStatusCode?: number } })
				.$metadata?.httpStatusCode;
			const name = (error as { name?: string }).name;
			if (status === 404 || name === 'NotFound') {
				return { exists: false };
			}
			throw error;
		}
	}

	async uploadPrivateFile(
		fileName: string,
		dataBuffer: Buffer,
		mimeType: string,
	) {
		const extension = fileName.split('.').pop();
		const newFilename = `${v4()}.${extension}`;

		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.s3Bucket,
				Key: newFilename,
				Body: dataBuffer,
				ContentType: mimeType,
			}),
		);

		return {
			fileName: fileName,
			key: newFilename,
		};
	}

	async getPresignedUrl(
		key: string,
		expiresIn = 900,
		downloadName?: string,
	): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.s3Bucket,
			Key: key,
			ResponseContentDisposition: downloadName
				? `attachment; filename="${downloadName}"`
				: undefined,
		});

		return getSignedUrl(this.s3Client, command, { expiresIn });
	}

	deleteFile(fileName: string) {
		return this.s3Client.send(
			new DeleteObjectCommand({
				Bucket: this.s3Bucket,
				Key: fileName,
			}),
		);
	}

	async downloadToBuffer(key: string): Promise<Buffer> {
		const result = await this.s3Client.send(
			new GetObjectCommand({ Bucket: this.s3Bucket, Key: key }),
		);
		const stream = result.Body as import('stream').Readable;
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		return Buffer.concat(chunks);
	}

	async uploadBuffer(
		key: string,
		buffer: Buffer,
		mimeType: string,
	): Promise<void> {
		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.s3Bucket,
				Key: key,
				Body: buffer,
				ContentType: mimeType,
			}),
		);
	}
}
