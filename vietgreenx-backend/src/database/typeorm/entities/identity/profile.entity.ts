import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Media } from '../media/media.entity';

// identity.profiles.user_id has UNIQUE constraint → OneToOne, not ManyToOne
// avatar_media_id and cover_media_id: FK ON DELETE SET NULL (ALTER TABLE deferred FK)
@Entity({ name: 'profiles', schema: 'identity' })
@Index('idx_profiles_user_id', ['userId'])
export class Profile {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid', unique: true })
	userId: string;

	@Column({ name: 'display_name', type: 'text' })
	displayName: string;

	@Column({ name: 'bio', type: 'text', nullable: true })
	bio: string | null;

	@Column({ name: 'avatar_media_id', type: 'uuid', nullable: true })
	avatarMediaId: string | null;

	@Column({ name: 'cover_media_id', type: 'uuid', nullable: true })
	coverMediaId: string | null;

	@Column({ name: 'website', type: 'text', nullable: true })
	website: string | null;

	@Column({ name: 'province', type: 'text', nullable: true })
	province: string | null;

	@Column({ name: 'district', type: 'text', nullable: true })
	district: string | null;

	@Column({ name: 'ward', type: 'text', nullable: true })
	ward: string | null;

	@Column({ name: 'province_code', type: 'int', nullable: true })
	provinceCode: number | null;

	@Column({ name: 'district_code', type: 'int', nullable: true })
	districtCode: number | null;

	@Column({ name: 'ward_code', type: 'int', nullable: true })
	wardCode: number | null;

	// location geography(Point,4326) — skip in TypeORM, use raw query

	@Column({ name: 'is_verified', type: 'boolean', default: false })
	isVerified: boolean;

	@Column({ name: 'is_private', type: 'boolean', default: false })
	isPrivate: boolean;

	@Column({ name: 'follower_count', type: 'int', default: 0 })
	followerCount: number;

	@Column({ name: 'following_count', type: 'int', default: 0 })
	followingCount: number;

	@Column({ name: 'post_count', type: 'int', default: 0 })
	postCount: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	// Owning side of the OneToOne: (u) => u.profile links back to User.profile
	@OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'avatar_media_id' })
	avatarMedia: Media | null;

	@ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'cover_media_id' })
	coverMedia: Media | null;
}
