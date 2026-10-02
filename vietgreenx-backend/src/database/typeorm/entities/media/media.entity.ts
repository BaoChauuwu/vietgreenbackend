import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { bigintTransformer } from '@app/database/typeorm/transformers/bigint.transformer';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { User } from '../identity/user.entity';

// media.media has: id, created_at, deleted_at — NO updated_at
// Do NOT extend EntityHelper (which injects updated_at column that doesn't exist in DB)
@Entity({ name: 'media', schema: 'media' })
@Index('idx_media_uploader', ['uploaderId'])
@Index('idx_media_type', ['mediaType'])
export class Media {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'uploader_id', type: 'uuid' })
	uploaderId: string;

	@Column({ name: 'media_type', type: 'text' })
	mediaType: string; // 'image' | 'video' | 'document' | 'audio'

	@Column({ name: 'storage_key', type: 'text', unique: true })
	storageKey: string;

	@Column({ name: 'cdn_url', type: 'text' })
	cdnUrl: string;

	@Column({ name: 'thumbnail_url', type: 'text', nullable: true })
	thumbnailUrl: string | null;

	@Column({
		name: 'file_size_bytes',
		type: 'bigint',
		transformer: bigintTransformer,
	})
	fileSizeBytes: number;

	@Column({ name: 'mime_type', type: 'text' })
	mimeType: string;

	@Column({ name: 'width_px', type: 'int', nullable: true })
	widthPx: number | null;

	@Column({ name: 'height_px', type: 'int', nullable: true })
	heightPx: number | null;

	@Column({
		name: 'duration_sec',
		type: 'decimal',
		precision: 8,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	durationSec: number | null;

	@Column({ name: 'alt_text', type: 'text', nullable: true })
	altText: string | null;

	@Column({ name: 'processing_status', type: 'text', default: 'pending' })
	processingStatus: string; // 'pending' | 'processing' | 'ready' | 'failed'

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'uploader_id' })
	uploader: User;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
	deletedAt: Date | null;
}
