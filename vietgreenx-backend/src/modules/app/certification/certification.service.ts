import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { Injectable, Logger } from '@nestjs/common';
import { GreenProfileAccessService } from '../green-profile/green-profile-access.service';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateCertUploadUrlRequestDto } from './dto/requests/create-cert-upload-url.request.dto';
import { v4 as uuidv4 } from 'uuid';
import { FileDriver } from '@app/config/file.config';
import { ConfigKeys } from '@app/config/config-key.enum';
import path from 'path';
import * as fs from 'fs';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpNotFoundError,
	HttpForbiddenError,
} from '@app/common/errors';
import { Certification } from '@app/database/typeorm/entities/agriculture/certification.entity';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { UpdateCertificationRequestDto } from './dto/requests/update-certification.request.dto';
import { CreateCertificationRequestDto } from './dto/requests/create-certification.request.dto';

@Injectable()
export class CertificationService {
	private readonly logger = new Logger(CertificationService.name);

	constructor(
		private readonly certificationRepository: CertificationRepository,
		private readonly greenProfileAccessService: GreenProfileAccessService,
		private readonly s3Service: S3Service,
		private readonly configService: ConfigService,
	) {}

	async create(
		user: User,
		dto: CreateCertificationRequestDto,
	): Promise<Certification> {
		await this.greenProfileAccessService.assertUserCanManageProfile(
			user.id,
			dto.greenProfileId,
		);

		this.validateDates(dto.issueDate, dto.expiryDate);
		this.assertFileOwnedByUser(user, dto.documentUrl);
		await this.assertFileExists(dto.documentUrl);

		return this.certificationRepository.create({
			...dto,
			status: CertificationStatus.PENDING,
			adminNote: null,
			reviewedBy: null,
			reviewedAt: null,
			alertSent30d: false,
			alertSent7d: false,
		});
	}

	async findAllByProfile(
		user: User,
		greenProfileId: string,
	): Promise<Certification[]> {
		await this.greenProfileAccessService.assertUserCanManageProfile(
			user.id,
			greenProfileId,
		);
		return this.certificationRepository.findAll({
			where: { greenProfileId },
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(user: User, id: string): Promise<Certification> {
		const cert = await this.certificationRepository.findOne({ id });
		if (!cert) {
			throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);
		}
		await this.greenProfileAccessService.assertUserCanManageProfile(
			user.id,
			cert.greenProfileId,
		);
		return cert;
	}

	async update(
		user: User,
		id: string,
		dto: UpdateCertificationRequestDto,
	): Promise<Certification> {
		const cert = await this.certificationRepository.findOne({ id });
		if (!cert) {
			throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);
		}

		await this.greenProfileAccessService.assertUserCanManageProfile(
			user.id,
			cert.greenProfileId,
		);

		const nextIssueDate =
			dto.issueDate !== undefined ? dto.issueDate : cert.issueDate;
		const nextExpiryDate =
			dto.expiryDate !== undefined ? dto.expiryDate : cert.expiryDate;

		if (dto.issueDate !== undefined || dto.expiryDate !== undefined) {
			this.validateDates(nextIssueDate, nextExpiryDate);
		}

		if (dto.documentUrl !== undefined) {
			this.assertFileOwnedByUser(user, dto.documentUrl);
			await this.assertFileExists(dto.documentUrl);
		}

		const updatePayload: any = { ...dto };
		if (dto.expiryDate !== undefined) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const expiry = new Date(nextExpiryDate);
			expiry.setHours(0, 0, 0, 0);

			if (expiry > today) {
				updatePayload.status = CertificationStatus.VALID;
				updatePayload.alertSent30d = false;
				updatePayload.alertSent7d = false;
			} else {
				updatePayload.status = CertificationStatus.EXPIRED;
			}
		}

		const updatedCert = await this.certificationRepository.update(
			id,
			updatePayload,
		);
		if (!updatedCert) {
			throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);
		}

		return updatedCert;
	}

	async delete(user: User, id: string): Promise<void> {
		const cert = await this.certificationRepository.findOne({ id });
		if (!cert) {
			throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);
		}
		await this.greenProfileAccessService.assertUserCanManageProfile(
			user.id,
			cert.greenProfileId,
		);
		try {
			if (this.getFileDriver() === FileDriver.LOCAL) {
				const localPath = this.getLocalFilePath(cert.documentUrl);
				if (fs.existsSync(localPath)) {
					await fs.promises.unlink(localPath);
				}
			} else {
				await this.s3Service.deleteFile(cert.documentUrl);
			}
		} catch (err) {
			this.logger.warn('Failed to delete cert file', err);
		}
		await this.certificationRepository.softDelete(id);
	}

	async createUploadUrl(
		user: User,
		dto: CreateCertUploadUrlRequestDto,
	): Promise<{
		storageKey: string;
		uploadUrl: string;
		uploadMethod: string;
		uploadField?: string;
	}> {
		const extension = dto.fileName.split('.').pop()?.toLowerCase() || 'pdf';
		const storageKey = `certifications/${user.id}/${uuidv4()}.${extension}`;

		const fileDriver = this.getFileDriver();
		if (
			fileDriver === FileDriver.S3 ||
			fileDriver === FileDriver.S3_PRESIGNED
		) {
			const uploadUrl = await this.s3Service.getPresignedUploadUrl(
				storageKey,
				dto.mimeType,
				900,
			);
			return { storageKey, uploadUrl, uploadMethod: 'PUT' };
		}

		const apiPrefix = this.configService.getOrThrow(ConfigKeys.API_PREFIX);
		return {
			storageKey,
			uploadUrl: `/${apiPrefix}/app/certifications/upload`,
			uploadMethod: 'POST',
			uploadField: 'file',
		};
	}

	async uploadLocalfile(
		user: User,
		file: Express.Multer.File,
		storageKey: string,
	): Promise<void> {
		if (this.getFileDriver() !== FileDriver.LOCAL) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_LOCAL_UPLOAD_ONLY);
		}

		const parts = storageKey.split('/');
		const userIdFromKey = parts[parts.length - 2];
		if (userIdFromKey !== user.id) {
			throw new HttpForbiddenError(ErrorCode.MEDIA_NOT_OWNED);
		}

		const localPath = this.getLocalFilePath(storageKey);

		await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
		await fs.promises.writeFile(localPath, file.buffer);
	}

	async getSignedDocumentUrl(
		storageKey: string,
		certId: string,
	): Promise<string> {
		if (this.getFileDriver() === FileDriver.LOCAL) {
			const apiPrefix = this.configService.getOrThrow(ConfigKeys.API_PREFIX);
			return `/${apiPrefix}/app/certifications/document/${certId}`;
		}
		return this.s3Service.getPresignedUrl(storageKey, 900);
	}

	getFileDriver(): FileDriver {
		return this.configService.get<FileDriver>('file.driver', FileDriver.LOCAL);
	}

	getLocalFilePath(storageKey: string): string {
		const parts = storageKey.split('/');
		const safeFilename = path.basename(parts[parts.length - 1]);
		const safeUserId = path.basename(parts[parts.length - 2] || 'unknown');
		return path.join(
			process.cwd(),
			'uploads',
			'certifications',
			safeUserId,
			safeFilename,
		);
	}

	private validateDates(issueDate: string, expiryDate: string): void {
		const issue = new Date(issueDate);
		const expiry = new Date(expiryDate);
		const today = new Date();

		today.setHours(0, 0, 0, 0);
		issue.setHours(0, 0, 0, 0);

		if (issue > today) {
			throw new HttpBadRequestError(ErrorCode.CERTIFICATION_ISSUE_DATE_FUTURE);
		}

		if (expiry <= issue) {
			throw new HttpBadRequestError(ErrorCode.CERTIFICATION_INVALID_DATE_RANGE);
		}
	}

	private async assertFileExists(storageKey: string): Promise<void> {
		const fileDriver = this.getFileDriver();
		if (
			fileDriver === FileDriver.S3 ||
			fileDriver === FileDriver.S3_PRESIGNED
		) {
			const head = await this.s3Service.headObject(storageKey);
			if (!head.exists) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}
		} else {
			const localPath = this.getLocalFilePath(storageKey);
			if (!fs.existsSync(localPath)) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}
		}
	}

	private assertFileOwnedByUser(user: User, documentUrl: string): void {
		const parts = documentUrl.split('/');
		const userIdFromKey = parts[parts.length - 2];
		if (userIdFromKey !== user.id) {
			throw new HttpForbiddenError(ErrorCode.MEDIA_NOT_OWNED);
		}
	}
}
