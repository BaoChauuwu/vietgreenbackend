import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { VerificationRequestRepository } from '@app/database/typeorm/repositories/verification-request.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { CreateOrganizationRequestDto } from './dto/requests/create-organization.request.dto';
import { SubmitVerificationRequestDto } from './dto/requests/submit-verification.request.dto';
import { UpdateOrganizationRequestDto } from './dto/requests/update-organization.request.dto';
import { AddMemberRequestDto } from './dto/requests/add-member.request.dto';
import { UpdateMemberRequestDto } from './dto/requests/update-member.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { OrgRole } from '@app/common/enums/org-role.enum';
import { OrgMemberStatus } from '@app/common/enums/org-member-status.enum';
import { Organization } from '@app/database/typeorm/entities/identity/organization.entity';
import { OrganizationMember } from '@app/database/typeorm/entities/identity/organization-member.entity';
import { EntityManager, In } from 'typeorm';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@app/config/config-key.enum';
import { EmailService } from '@app/services/email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
		private readonly organizationMemberRepository: OrganizationMemberRepository,
		private readonly verificationRequestRepository: VerificationRequestRepository,
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly emailService: EmailService,
	) {}

	private escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	private getJwtSecret(): string {
		const secret = this.configService.get<string>(ConfigKeys.JWT_SECRET);
		if (!secret) {
			if ((process.env.NODE_ENV ?? 'development') === 'production') {
				throw new Error('JWT_SECRET is not configured');
			}
			return 'secret';
		}
		return secret;
	}

	private generateSlug(name: string): string {
		return (
			name
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[đĐ]/g, 'd')
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim() +
			'-' +
			uuidv4()
		);
	}

	async createOrganization(userId: string, dto: CreateOrganizationRequestDto) {
		const slug = this.generateSlug(dto.name);

		return this.organizationRepository.executeInTransaction(
			async (manager: EntityManager) => {
				//  Create Organization
				const orgEntity = manager.create(Organization, {
					...dto,
					ownerUserId: userId,
					slug,
				});
				const savedOrg = await manager.save(Organization, orgEntity);

				//  Create OrganizationMember (Admin)
				const memberEntity = manager.create(OrganizationMember, {
					organizationId: savedOrg.id,
					userId: userId,
					orgRole: OrgRole.ADMIN,
					status: OrgMemberStatus.ACTIVE,
				});
				await manager.save(OrganizationMember, memberEntity);

				return savedOrg;
			},
		);
	}

	async findAllActive(paginationDto: PaginationDto) {
		return this.organizationRepository.findActiveWithMemberCount(
			paginationDto.page,
			paginationDto.limit,
		);
	}

	async findMyOrganizations(userId: string) {
		const memberships = await this.organizationMemberRepository.findAll({
			where: { userId, status: OrgMemberStatus.ACTIVE },
			relations: [
				'organization',
				'organization.logoMedia',
				'organization.coverMedia',
			],
		});

		return memberships
			.filter((m) => m.organization?.isActive)
			.map((m) => ({ orgRole: m.orgRole, organization: m.organization }));
	}

	async findById(id: string) {
		const org = await this.organizationRepository.findOne(
			{ id, isActive: true },
			['logoMedia', 'coverMedia'],
		);
		if (!org) throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
		return org;
	}

	async submitVerification(
		userId: string,
		orgId: string,
		dto: SubmitVerificationRequestDto,
	) {
		await this.checkIsOrgAdmin(userId, orgId);

		const org = await this.organizationRepository.findById(orgId);
		if (!org || !org.isActive) {
			throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
		}

		if (org.verificationLevel !== VerificationLevel.UNVERIFIED) {
			throw new HttpBadRequestError(ErrorCode.ORGANIZATION_ALREADY_VERIFIED);
		}

		const existingPending = await this.verificationRequestRepository.exists({
			organizationId: orgId,
			status: In(['pending', 'under_review']),
		});

		if (existingPending) {
			throw new HttpBadRequestError(
				ErrorCode.ORGANIZATION_ALREADY_HAS_PENDING_VERIFICATION_REQUEST,
			);
		}

		return this.verificationRequestRepository.create({
			userId: null,
			organizationId: orgId,
			requestedLevel: VerificationLevel.BASIC,
			documentType: dto.documentType,
			documentFrontUrl: dto.documentFrontUrl,
			documentBackUrl: dto.documentBackUrl,
			additionalDocs: dto.additionalDocs || [],
			status: 'pending',
		});
	}

	private async assertOrgHasActiveMemberCapacity(orgId: string) {
		const org = await this.organizationRepository.findById(orgId);
		if (!org) {
			throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
		}

		const activeCount = await this.organizationMemberRepository.count({
			organizationId: orgId,
			status: OrgMemberStatus.ACTIVE,
		});

		if (activeCount >= org.memberLimit) {
			throw new HttpBadRequestError(
				ErrorCode.ORGANIZATION_MEMBER_LIMIT_REACHED,
			);
		}
	}

	private async checkIsOrgAdmin(userId: string, orgId: string) {
		const member = await this.organizationMemberRepository.findOne({
			organizationId: orgId,
			userId: userId,
			orgRole: OrgRole.ADMIN,
			status: OrgMemberStatus.ACTIVE,
		});
		if (!member) {
			throw new HttpForbiddenError(
				ErrorCode.ONLY_ACTIVE_ADMINS_CAN_PERFORM_THIS_ACTION,
			);
		}
		return member;
	}

	async updateOrganization(
		userId: string,
		orgId: string,
		dto: UpdateOrganizationRequestDto,
	) {
		await this.checkIsOrgAdmin(userId, orgId);

		const org = await this.organizationRepository.findById(orgId);
		if (!org) throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);

		await this.organizationRepository.update(orgId, dto);
		const updatedOrg = await this.organizationRepository.findById(orgId, [
			'logoMedia',
			'coverMedia',
		]);
		return updatedOrg;
	}

	async deleteOrganization(userId: string, orgId: string) {
		await this.checkIsOrgAdmin(userId, orgId);

		const org = await this.organizationRepository.findById(orgId);
		if (!org) throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);

		return this.organizationRepository.update(orgId, { isActive: false });
	}

	async addMember(adminId: string, orgId: string, dto: AddMemberRequestDto) {
		await this.checkIsOrgAdmin(adminId, orgId);

		const org = await this.organizationRepository.findById(orgId);
		if (!org) {
			throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
		}

		if (!org.isActive) {
			throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
		}

		const targetUser = await this.userRepository.findOne({ id: dto.userId });
		if (!targetUser) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const newMember = await this.organizationRepository.executeInTransaction(
			async (manager: EntityManager) => {
				const lockedOrg = await manager
					.getRepository(Organization)
					.createQueryBuilder('org')
					.setLock('pessimistic_write')
					.where('org.id = :orgId', { orgId })
					.getOne();

				if (!lockedOrg || !lockedOrg.isActive) {
					throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
				}

				const memberRepository = manager.getRepository(OrganizationMember);
				const activeCount = await memberRepository.count({
					where: { organizationId: orgId, status: OrgMemberStatus.ACTIVE },
				});
				const invitedCount = await memberRepository.count({
					where: { organizationId: orgId, status: OrgMemberStatus.INVITED },
				});

				if (activeCount + invitedCount >= lockedOrg.memberLimit) {
					throw new HttpBadRequestError(
						ErrorCode.ORGANIZATION_MEMBER_LIMIT_REACHED,
					);
				}

				const existing = await memberRepository.findOne({
					where: { organizationId: orgId, userId: dto.userId },
				});
				if (existing) {
					throw new HttpBadRequestError(
						ErrorCode.USER_ALREADY_MEMBER_OR_INVITED,
					);
				}

				return memberRepository.save(
					memberRepository.create({
						organizationId: orgId,
						userId: dto.userId,
						orgRole: dto.orgRole,
						status: OrgMemberStatus.INVITED,
						invitedBy: adminId,
					}),
				);
			},
		);

		const secret = this.getJwtSecret();
		const inviteToken = await this.jwtService.signAsync(
			{ orgId, userId: dto.userId, role: dto.orgRole },
			{ secret, expiresIn: '7d' },
		);

		const frontendUrl =
			this.configService.get<string>(ConfigKeys.FRONTEND_DOMAIN) ??
			'http://localhost:3000';
		const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}`;

		// Fetch with relations to return full DTO
		const member = await this.organizationMemberRepository.findOne(
			{ id: newMember.id },
			['user', 'user.profile', 'user.profile.avatarMedia'],
		);

		// Send email if user has email
		if (member?.user?.email) {
			const org = await this.organizationRepository.findById(orgId);
			const orgName = this.escapeHtml(org?.name || 'an organization');
			const username = this.escapeHtml(member.user.username);
			void this.emailService.sendMail({
				to: member.user.email,
				subject: `[VietGreenX] You are invited to join ${org?.name || 'an organization'}`,
				html: `
					<h2>Hello ${username},</h2>
					<p>You have been invited to join <strong>${orgName}</strong> on VietGreenX.</p>
					<p>Click the link below to accept the invitation:</p>
					<br/>
					<a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background-color:#008000;color:white;text-decoration:none;border-radius:5px;">Accept Invitation</a>
					<br/><br/>
					<p>Or copy this link to your browser: ${inviteLink}</p>
				`,
			});
		}

		return { inviteLink, member };
	}

	async acceptInvite(userId: string, token: string) {
		const secret = this.getJwtSecret();
		let payload: { orgId: string; userId: string; role: string };
		try {
			payload = await this.jwtService.verifyAsync(token, { secret });
		} catch {
			throw new HttpBadRequestError(ErrorCode.INVALID_INVITE_TOKEN);
		}

		if (payload.userId !== userId) {
			throw new HttpForbiddenError(ErrorCode.UNAUTHORIZED_ACCEPT_INVITATION);
		}

		const memberId = await this.organizationRepository.executeInTransaction(
			async (manager: EntityManager) => {
				const memberRepository = manager.getRepository(OrganizationMember);
				const member = await memberRepository.findOne({
					where: {
						organizationId: payload.orgId,
						userId: payload.userId,
						status: OrgMemberStatus.INVITED,
					},
				});

				if (!member) {
					throw new HttpNotFoundError(
						ErrorCode.INVITATION_NOT_FOUND_OR_ALREADY_ACCEPTED,
					);
				}

				const org = await manager
					.getRepository(Organization)
					.createQueryBuilder('org')
					.setLock('pessimistic_write')
					.where('org.id = :orgId', { orgId: payload.orgId })
					.getOne();

				if (!org || !org.isActive) {
					throw new HttpNotFoundError(ErrorCode.ORGANIZATION_NOT_FOUND);
				}

				const activeCount = await memberRepository.count({
					where: {
						organizationId: payload.orgId,
						status: OrgMemberStatus.ACTIVE,
					},
				});

				if (activeCount >= org.memberLimit) {
					throw new HttpBadRequestError(
						ErrorCode.ORGANIZATION_MEMBER_LIMIT_REACHED,
					);
				}

				member.status = OrgMemberStatus.ACTIVE;
				await memberRepository.save(member);
				return member.id;
			},
		);

		const updatedMember = await this.organizationMemberRepository.findOne(
			{ id: memberId },
			['user', 'user.profile', 'user.profile.avatarMedia'],
		);

		return updatedMember;
	}

	async declineInvite(userId: string, token: string) {
		const secret = this.getJwtSecret();
		let payload: { orgId: string; userId: string; role: string };
		try {
			payload = await this.jwtService.verifyAsync(token, { secret });
		} catch {
			throw new HttpBadRequestError(ErrorCode.INVALID_INVITE_TOKEN);
		}

		if (payload.userId !== userId) {
			throw new HttpForbiddenError(ErrorCode.UNAUTHORIZED_DECLINE_INVITATION);
		}

		const member = await this.organizationMemberRepository.findOne({
			organizationId: payload.orgId,
			userId: payload.userId,
			status: OrgMemberStatus.INVITED,
		});

		if (!member) {
			throw new HttpNotFoundError(
				ErrorCode.INVITATION_NOT_FOUND_OR_ALREADY_ACCEPTED,
			);
		}

		// Delete the pending member record upon rejection
		await this.organizationMemberRepository.delete(member.id);

		return null;
	}

	async getMembers(orgId: string, paginationDto: PaginationDto) {
		return this.organizationMemberRepository.findWithPagination(
			paginationDto.page,
			paginationDto.limit,
			{
				where: { organizationId: orgId, status: OrgMemberStatus.ACTIVE },
				relations: ['user', 'user.profile', 'user.profile.avatarMedia'],
			},
		);
	}

	async updateMemberRole(
		adminId: string,
		orgId: string,
		memberUserId: string,
		dto: UpdateMemberRequestDto,
	) {
		await this.checkIsOrgAdmin(adminId, orgId);

		const member = await this.organizationMemberRepository.findOne({
			organizationId: orgId,
			userId: memberUserId,
		});

		if (!member) {
			throw new HttpNotFoundError(ErrorCode.MEMBER_NOT_FOUND_IN_ORGANIZATION);
		}

		if (
			dto.status === OrgMemberStatus.ACTIVE &&
			member.status === OrgMemberStatus.INVITED
		) {
			throw new HttpBadRequestError(ErrorCode.MEMBER_MUST_ACCEPT_INVITE);
		}

		if (
			dto.status === OrgMemberStatus.ACTIVE &&
			member.status !== OrgMemberStatus.ACTIVE
		) {
			await this.assertOrgHasActiveMemberCapacity(orgId);
		}

		if (
			member.orgRole === OrgRole.ADMIN &&
			member.status === OrgMemberStatus.ACTIVE &&
			dto.status === OrgMemberStatus.INACTIVE
		) {
			const adminCount = await this.organizationMemberRepository.count({
				organizationId: orgId,
				orgRole: OrgRole.ADMIN,
				status: OrgMemberStatus.ACTIVE,
			});
			if (adminCount <= 1) {
				throw new HttpBadRequestError(ErrorCode.CANNOT_DEACTIVATE_LAST_ADMIN);
			}
		}

		// Prevent changing the last admin
		if (
			member.orgRole === OrgRole.ADMIN &&
			dto.orgRole &&
			dto.orgRole !== OrgRole.ADMIN
		) {
			const adminCount = await this.organizationMemberRepository.count({
				organizationId: orgId,
				orgRole: OrgRole.ADMIN,
				status: OrgMemberStatus.ACTIVE,
			});
			if (adminCount <= 1) {
				throw new HttpBadRequestError(ErrorCode.CANNOT_DEMOTE_LAST_ADMIN);
			}
		}

		await this.organizationMemberRepository.update(member.id, dto);

		// Fetch updated to return proper DTO
		const updatedMember = await this.organizationMemberRepository.findOne(
			{ id: member.id },
			['user', 'user.profile', 'user.profile.avatarMedia'],
		);

		return updatedMember;
	}

	async removeMember(adminId: string, orgId: string, memberUserId: string) {
		await this.checkIsOrgAdmin(adminId, orgId);

		const member = await this.organizationMemberRepository.findOne({
			organizationId: orgId,
			userId: memberUserId,
		});

		if (!member) {
			throw new HttpNotFoundError(ErrorCode.MEMBER_NOT_FOUND_IN_ORGANIZATION);
		}

		// Prevent removing the last admin
		if (member.orgRole === OrgRole.ADMIN) {
			const adminCount = await this.organizationMemberRepository.count({
				organizationId: orgId,
				orgRole: OrgRole.ADMIN,
				status: OrgMemberStatus.ACTIVE,
			});
			if (adminCount <= 1) {
				throw new HttpBadRequestError(ErrorCode.CANNOT_REMOVE_LAST_ADMIN);
			}
		}

		await this.organizationMemberRepository.delete(member.id);
		return null;
	}
}
