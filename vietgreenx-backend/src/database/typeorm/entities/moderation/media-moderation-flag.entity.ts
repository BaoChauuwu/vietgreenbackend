import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ModerationVerdict } from '@app/common/enums/moderation-verdict.enum';

@Entity({ name: 'media_moderation_flags', schema: 'moderation' })
export class MediaModerationFlag {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'media_id', type: 'uuid', unique: true })
	mediaId: string;

	@Column({ name: 'owner_id', type: 'uuid' })
	ownerId: string;

	@Column({ name: 'verdict', type: 'text' })
	verdict: ModerationVerdict;

	@Column({ name: 'exif_suspicious', type: 'boolean', default: false })
	exifSuspicious: boolean;

	@Column({ name: 'matched_media_id', type: 'uuid', nullable: true })
	matchedMediaId: string | null;

	@Column({ name: 'matched_owner_id', type: 'uuid', nullable: true })
	matchedOwnerId: string | null;

	@Column({ name: 'distance', type: 'int', nullable: true })
	distance: number | null;

	@Column({ name: 'details', type: 'jsonb', nullable: true })
	details: Record<string, unknown> | null;

	@Column({ name: 'status', type: 'text', default: 'pending' })
	status: string;

	@Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
	reviewedBy: string | null;

	@Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
	reviewedAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
