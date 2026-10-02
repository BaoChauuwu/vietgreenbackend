import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'media_hashes', schema: 'moderation' })
export class MediaHash {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'media_id', type: 'uuid', unique: true })
	mediaId: string;

	@Column({ name: 'owner_id', type: 'uuid' })
	ownerId: string;

	// PostgreSQL returns bigint as string — keep as string, convert to BigInt in processor
	@Column({ name: 'phash', type: 'bigint' })
	phash: string;

	@Column({ name: 'dhash', type: 'bigint' })
	dhash: string;

	@Column({ name: 'purpose', type: 'text' })
	purpose: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
