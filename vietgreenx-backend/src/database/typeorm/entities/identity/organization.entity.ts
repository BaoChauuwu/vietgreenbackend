import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { OrgType } from '@app/common/enums/org-type.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { User } from './user.entity';
import { Media } from '../media/media.entity';

@Entity({ name: 'organizations', schema: 'identity' })
@Index('idx_org_owner', ['ownerUserId'])
export class Organization extends EntityHelper {
	@Column({ name: 'owner_user_id', type: 'uuid' })
	ownerUserId: string;

	@Column({
		name: 'org_type',
		type: 'enum',
		enum: OrgType,
		enumName: 'org_type',
		default: OrgType.COOPERATIVE,
	})
	orgType: OrgType;

	@Column({ name: 'name', type: 'text' })
	name: string;

	@Column({ name: 'slug', type: 'text', unique: true })
	slug: string;

	@Column({ name: 'tax_code', type: 'text', nullable: true })
	taxCode: string | null;

	@Column({ name: 'registration_number', type: 'text', nullable: true })
	registrationNumber: string | null;

	@Column({ name: 'address', type: 'text', nullable: true })
	address: string | null;

	@Column({ name: 'province', type: 'text', nullable: true })
	province: string | null;

	@Column({ name: 'district', type: 'text', nullable: true })
	district: string | null;

	@Column({ name: 'ward', type: 'text', nullable: true })
	ward: string | null;

	// location geography(Point,4326) — skip, use raw query

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'logo_media_id', type: 'uuid', nullable: true })
	logoMediaId: string | null;

	@Column({ name: 'cover_media_id', type: 'uuid', nullable: true })
	coverMediaId: string | null;

	@Column({ name: 'website', type: 'text', nullable: true })
	website: string | null;

	@Column({ name: 'registration_cert_url', type: 'text', nullable: true })
	registrationCertUrl: string | null;

	@Column({
		name: 'verification_level',
		type: 'enum',
		enum: VerificationLevel,
		enumName: 'verification_level',
		default: VerificationLevel.UNVERIFIED,
	})
	verificationLevel: VerificationLevel;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@Column({ name: 'member_limit', type: 'int', default: 10 })
	memberLimit: number;

	@Column({ name: 'follower_count', type: 'int', default: 0 })
	followerCount: number;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'owner_user_id' })
	owner: User;

	// logo_media_id / cover_media_id: FK ON DELETE SET NULL (ALTER TABLE deferred FK)
	@ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'logo_media_id' })
	logoMedia: Media | null;

	@ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'cover_media_id' })
	coverMedia: Media | null;
}
