import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

const CERT_CHUNK_SIZE = 200;
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { OrgRole } from '@app/common/enums/org-role.enum';
import { OrgMemberStatus } from '@app/common/enums/org-member-status.enum';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { EntityManager } from 'typeorm';
import {
	Certification,
	Notification,
	OrganizationMember,
} from '@app/database/typeorm/entities';

@Injectable()
export class CertificationExpiryJob {
	private readonly logger = new Logger(CertificationExpiryJob.name);

	constructor(
		private readonly certificationRepository: CertificationRepository,
		private readonly organizationMemberRepository: OrganizationMemberRepository,
		private readonly notificationRepository: NotificationRepository,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleCron() {
		this.logger.log('Starting Certification Expiry and Alert Job...');

		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			let expiredCount = 0;
			let alert30dCount = 0;
			let alert7dCount = 0;
			let page = 0;

			while (true) {
				const certifications = await this.certificationRepository.findAll({
					where: { status: CertificationStatus.VALID },
					relations: ['greenProfile'],
					take: CERT_CHUNK_SIZE,
					skip: page * CERT_CHUNK_SIZE,
				});

				if (certifications.length === 0) break;

				for (const cert of certifications) {
					if (!cert.greenProfile) {
						this.logger.warn(
							`Certification ${cert.id} has no associated green profile, skipping.`,
						);
						continue;
					}

					const expiry = new Date(cert.expiryDate);
					expiry.setHours(0, 0, 0, 0);

					const timeDiff = expiry.getTime() - today.getTime();
					const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

					let updatedStatus = cert.status;
					let updatedAlert30d = cert.alertSent30d;
					let updatedAlert7d = cert.alertSent7d;
					let shouldNotify = false;
					let notifTitle = '';
					let notifBody = '';

					if (diffDays <= 0) {
						updatedStatus = CertificationStatus.EXPIRED;
						shouldNotify = true;
						notifTitle = 'Certification Expired';
						notifBody = `Certification ${cert.certType} (No: ${cert.certNumber || 'N/A'}) of profile ${cert.greenProfile.profileName} has expired.`;
						expiredCount++;
					} else if (diffDays <= 7) {
						if (!cert.alertSent7d) {
							updatedAlert7d = true;
							updatedAlert30d = true;
							shouldNotify = true;
							notifTitle = 'Certification Expiring in 7 Days';
							notifBody = `Certification ${cert.certType} (No: ${cert.certNumber || 'N/A'}) of profile ${cert.greenProfile.profileName} will expire in 7 days.`;
							alert7dCount++;
						}
					} else if (diffDays <= 30) {
						if (!cert.alertSent30d) {
							updatedAlert30d = true;
							shouldNotify = true;
							notifTitle = 'Certification Expiring in 30 Days';
							notifBody = `Certification ${cert.certType} (No: ${cert.certNumber || 'N/A'}) of profile ${cert.greenProfile.profileName} will expire in 30 days.`;
							alert30dCount++;
						}
					}

					const hasChanges =
						updatedStatus !== cert.status ||
						updatedAlert30d !== cert.alertSent30d ||
						updatedAlert7d !== cert.alertSent7d;

					if (hasChanges || shouldNotify) {
						try {
							await this.certificationRepository.executeInTransaction(
								async (manager) => {
									if (hasChanges) {
										await manager.update(
											Certification,
											{ id: cert.id },
											{
												status: updatedStatus,
												alertSent30d: updatedAlert30d,
												alertSent7d: updatedAlert7d,
											},
										);
									}

									if (shouldNotify) {
										const recipients = await this.resolveRecipients(
											manager,
											cert,
										);
										if (recipients.length > 0) {
											const notifs = recipients.map((recipientId) => {
												return manager.create(Notification, {
													recipientId,
													actorId: null,
													notifType: NotifType.CERTIFICATION_EXPIRING,
													entityType: 'certification',
													entityId: cert.id,
													title: notifTitle,
													body: notifBody,
													deepLink: `/app/certifications/profile/${cert.greenProfileId}`,
													isRead: false,
												});
											});
											await manager.save(Notification, notifs);
										} else {
											this.logger.warn(
												`No active recipients found for certification alert (Cert ID: ${cert.id})`,
											);
										}
									}
								},
							);
						} catch (err) {
							this.logger.error(
								`Failed to update and notify for certification ${cert.id}: ${err.message}`,
								err.stack,
							);
						}
					}
				}

				if (certifications.length < CERT_CHUNK_SIZE) break;
				page++;
			}

			this.logger.log(
				`Certification check complete. Expired: ${expiredCount}, 7d alerts: ${alert7dCount}, 30d alerts: ${alert30dCount}`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to complete certification expiry check: ${error.message}`,
				error.stack,
			);
		}
	}

	private async resolveRecipients(
		manager: EntityManager,
		cert: any,
	): Promise<string[]> {
		const recipients: string[] = [];

		if (cert.greenProfile.userId) {
			recipients.push(cert.greenProfile.userId);
		} else if (cert.greenProfile.organizationId) {
			const members = await manager.find(OrganizationMember, {
				where: {
					organizationId: cert.greenProfile.organizationId,
					orgRole: OrgRole.ADMIN,
					status: OrgMemberStatus.ACTIVE,
				},
				select: { userId: true },
			});
			for (const member of members) {
				if (member.userId) {
					recipients.push(member.userId);
				}
			}
		}

		return recipients;
	}
}
