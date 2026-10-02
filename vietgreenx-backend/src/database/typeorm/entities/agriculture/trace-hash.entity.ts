import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'trace_hashes', schema: 'agriculture' })
@Index('idx_trace_hash_entity', ['entityType', 'entityId'])
export class TraceHash {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'entity_type', type: 'text' })
	entityType: string; // 'product' | 'batch' | 'production_log' | 'certification'

	@Column({ name: 'entity_id', type: 'uuid' })
	entityId: string;

	@Column({ name: 'hash', type: 'text' })
	hash: string;

	@Column({ name: 'prev_hash', type: 'text', nullable: true })
	prevHash: string | null;

	@Column({ name: 'chain_index', type: 'bigint', default: 0 })
	chainIndex: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
