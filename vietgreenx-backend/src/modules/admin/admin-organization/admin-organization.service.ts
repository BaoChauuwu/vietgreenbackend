import { Injectable } from '@nestjs/common';
import { VerificationRequestRepository } from '@app/database/typeorm/repositories/verification-request.repository';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { EntityManager, IsNull, Not } from 'typeorm';
import { VerificationRequest } from '@app/database/typeorm/entities/identity/verification-request.entity';
import { Organization } from '@app/database/typeorm/entities/identity/organization.entity';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { ErrorCode } from '@app/common/errors/error-code';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { NotificationService } from '@app/modules/app/notification/notification.service';
import { NotifType } from '@app/common/enums/notif-type.enum';

@Injectable()
export class AdminOrganizationService {
	constructor(
		private readonly verificationRequestRepository: VerificationRequestRepository,
		private readonly organizationRepository: OrganizationRepository,
		private readonly notificationService: NotificationService,
	) {}

	async getPendingVerifications(paginationDto: PaginationDto) {
		const result = await this.verificationRequestRepository.findWithPagination(
			paginationDto.page,
			paginationDto.limit,
			{
				// org verifications only — exclude user-profile verification requests
				where: { status: 'pending', organizationId: Not(IsNull()) },
				// load org.owner so we have submitter info (userId is null for org requests)
				relations: ['organization', 'organization.owner', 'user'],
				order: { submittedAt: 'ASC' },
			},
		);

		// org verification requests have userId=null; expose org owner as the submitter
		for (const item of result.items) {
			if (!item.user && item.organization?.owner) {
				item.user = item.organization.owner;
			}
		}

		return result;
	}

	async approveVerification(id: string, adminId: string) {
		const request = await this.verificationRequestRepository.findById(id);
		if (!request) {
			throw new HttpNotFoundError(ErrorCode.VERIFICATION_REQUEST_NOT_FOUND);
		}
		// reject user-profile requests: this endpoint handles org verifications only
		if (!request.organizationId) {
			throw new HttpNotFoundError(ErrorCode.VERIFICATION_REQUEST_NOT_FOUND);
		}
		if (request.status !== 'pending') {
			throw new HttpBadRequestError(ErrorCode.VERIFICATION_REQUEST_NOT_PENDING);
		}

		await this.verificationRequestRepository.executeInTransaction(
			async (manager: EntityManager) => {
				await manager.update(VerificationRequest, id, {
					status: 'approved',
					reviewedBy: adminId,
					reviewedAt: new Date(),
				});

				// bump version for optimistic locking on concurrent approval/update
				await manager.update(Organization, request.organizationId!, {
					verificationLevel: request.requestedLevel,
					version: () => 'version + 1',
				});
			},
		);

		const org = await this.organizationRepository.findById(
			request.organizationId!,
		);
		if (org?.ownerUserId) {
			await this.notificationService.sendVerificationNotification(
				org.ownerUserId,
				NotifType.VERIFICATION_APPROVED,
			);
		}

		return null;
	}

	async rejectVerification(id: string, adminId: string, reason: string) {
		const request = await this.verificationRequestRepository.findById(id);
		if (!request) {
			throw new HttpNotFoundError(ErrorCode.VERIFICATION_REQUEST_NOT_FOUND);
		}
		// reject user-profile requests: this endpoint handles org verifications only
		if (!request.organizationId) {
			throw new HttpNotFoundError(ErrorCode.VERIFICATION_REQUEST_NOT_FOUND);
		}
		if (request.status !== 'pending') {
			throw new HttpBadRequestError(ErrorCode.VERIFICATION_REQUEST_NOT_PENDING);
		}

		await this.verificationRequestRepository.update(id, {
			status: 'rejected',
			rejectionReason: reason,
			reviewedBy: adminId,
			reviewedAt: new Date(),
		});

		const org = await this.organizationRepository.findById(
			request.organizationId!,
		);
		if (org?.ownerUserId) {
			await this.notificationService.sendVerificationNotification(
				org.ownerUserId,
				NotifType.VERIFICATION_REJECTED,
			);
		}

		return null;
	}
}
