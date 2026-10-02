import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Unique,
} from 'typeorm';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { FollowStatus } from '@app/common/enums/follow-status.enum';

// uq_follow: a user can only follow a given user/org once (exactly one of followeeUserId/followeeOrgId is set)
@Entity({ name: 'follows', schema: 'social_graph' })
@Index('idx_follows_follower', ['followerId'])
@Index('idx_follows_followee_user', ['followeeUserId'])
@Index('idx_follows_followee_org', ['followeeOrgId'])
@Unique('uq_follow', ['followerId', 'followeeUserId', 'followeeOrgId'])
export class Follow {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'follower_id', type: 'uuid' })
	followerId: string;

	@Column({ name: 'followee_user_id', type: 'uuid', nullable: true })
	followeeUserId: string | null;

	@Column({ name: 'followee_org_id', type: 'uuid', nullable: true })
	followeeOrgId: string | null;

	@Column({ name: 'status', type: 'text', default: 'active' })
	status: FollowStatus; // 'active' | 'pending' | 'removed'

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'follower_id' })
	follower: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'followee_user_id' })
	followeeUser: User | null;

	@ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'followee_org_id' })
	followeeOrg: Organization | null;
}
