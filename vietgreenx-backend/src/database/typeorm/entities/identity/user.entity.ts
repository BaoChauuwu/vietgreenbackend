// src/database/typeorm/entities/identity/user.entity.ts
import { Column, Entity, Index, OneToOne, Unique } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { UserRole } from '@app/common/enums/user-role.enum';
import { SignupChannel } from '@app/common/enums/signup-channel.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';
import { Profile } from './profile.entity';

// uq_users_provider: one account per OAuth provider — prevents duplicate social logins
@Entity({ name: 'users', schema: 'identity' })
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
@Index('idx_users_verif_level', ['verificationLevel'])
@Index('idx_users_created_at', ['createdAt'])
@Unique('uq_users_provider', ['authProvider', 'authProviderId'])
export class User extends EntityHelper {
	@Column({ name: 'username', type: 'text', unique: true })
	username: string;

	@Column({ name: 'email', type: 'text', nullable: true })
	email: string | null;

	@Column({ name: 'phone', type: 'text', nullable: true })
	phone: string | null;

	@Column({ name: 'password_hash', type: 'text' })
	passwordHash: string;

	@Column({ name: 'auth_provider', type: 'text', default: 'local' })
	authProvider: string;

	@Column({ name: 'auth_provider_id', type: 'text', nullable: true })
	authProviderId: string | null;

	@Column({
		name: 'role',
		type: 'enum',
		enum: UserRole,
		enumName: 'user_role',
		default: UserRole.CONSUMER,
	})
	role: UserRole;

	@Column({
		name: 'status',
		type: 'enum',
		enum: UserStatus,
		enumName: 'user_status',
		default: UserStatus.ACTIVE,
	})
	status: UserStatus;

	@Column({
		name: 'verification_level',
		type: 'enum',
		enum: VerificationLevel,
		enumName: 'verification_level',
		default: VerificationLevel.UNVERIFIED,
	})
	verificationLevel: VerificationLevel;

	@Column({ name: 'email_verified', type: 'boolean', default: false })
	emailVerified: boolean;

	@Column({ name: 'phone_verified', type: 'boolean', default: false })
	phoneVerified: boolean;

	@Column({ name: 'signup_channel', type: 'text', nullable: true })
	signupChannel: SignupChannel | null;

	@Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
	lastLoginAt: Date | null;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@Column({
		name: 'plan',
		type: 'enum',
		enum: MembershipPlan,
		enumName: 'membership_plan',
		default: MembershipPlan.FREE,
	})
	plan: MembershipPlan;

	@Column({ name: 'plan_expires_at', type: 'timestamptz', nullable: true })
	planExpiresAt: Date | null;

	@Column({ name: 'two_factor_secret', type: 'text', nullable: true })
	twoFactorSecret: string | null;

	@Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
	twoFactorEnabled: boolean;

	@Column({
		name: 'two_factor_backup_codes',
		type: 'text',
		array: true,
		nullable: true,
	})
	twoFactorBackupCodes: string[] | null;

	@OneToOne(() => Profile, (p) => p.user)
	profile: Profile;
}
