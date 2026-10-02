import { Injectable } from '@nestjs/common';
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpNotFoundError,
} from '@app/common/errors';
import { ReviewCertificationRequestDto } from './dto/requests/review-certification.request.dto';
import { ListCertificationsQueryDto } from './dto/requests/list-certifications-query.request.dto';
import { Pagination } from '@app/common/types/request-response.type';
import { Certification } from '@app/database/typeorm/entities/agriculture/certification.entity';

@Injectable()
export class AdminCertificationService {
	constructor(
		private readonly certificationRepository: CertificationRepository,
	) {}

	async listCertifications(
		query: ListCertificationsQueryDto,
	): Promise<Pagination<Certification>> {
		const status = query.status ?? CertificationStatus.PENDING;
		const where: Record<string, unknown> = { status };
		if (query.greenProfileId) where['greenProfileId'] = query.greenProfileId;

		const [items, total] = await Promise.all([
			this.certificationRepository.findAll({
				where,
				relations: ['greenProfile'],
				order: { createdAt: 'ASC' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
			}),
			this.certificationRepository.count(where),
		]);

		const mappedItems = items.map((c) => {
			(c as any).profileName = c.greenProfile?.profileName ?? null;
			return c;
		});

		return {
			items: mappedItems,
			total,
			page: query.page,
			limit: query.limit,
			totalPage: Math.ceil(total / query.limit),
		};
	}

	async reviewCertification(
		id: string,
		dto: ReviewCertificationRequestDto,
		adminId: string,
	): Promise<Certification> {
		const cert = await this.certificationRepository.findOne({ id }, [
			'greenProfile',
		]);
		if (!cert) throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);

		if (cert.status !== CertificationStatus.PENDING) {
			throw new HttpBadRequestError(ErrorCode.CERTIFICATION_ALREADY_REVIEWED);
		}

		if (dto.status === CertificationStatus.REJECTED && !dto.adminNote) {
			throw new HttpBadRequestError(
				ErrorCode.CERTIFICATION_REJECT_REQUIRES_NOTE,
			);
		}

		const updated = await this.certificationRepository.update(id, {
			status: dto.status,
			adminNote: dto.adminNote ?? null,
			reviewedBy: adminId,
			reviewedAt: new Date(),
		});

		if (!updated)
			throw new HttpNotFoundError(ErrorCode.CERTIFICATION_NOT_FOUND);
		(updated as any).profileName = cert.greenProfile?.profileName ?? null;
		return updated;
	}
}
