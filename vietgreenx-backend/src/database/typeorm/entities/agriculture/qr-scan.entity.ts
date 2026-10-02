import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
} from 'typeorm';
import { PublicTraceToken } from './public-trace-token.entity';

@Entity({ name: 'qr_scans', schema: 'agriculture' })
@Index('idx_scan_token', ['tokenId'])
export class QrScan {
	@PrimaryColumn({
		name: 'id',
		type: 'uuid',
		default: () => 'uuid_generate_v7()',
	})
	id: string;

	@PrimaryColumn({
		name: 'scanned_at',
		type: 'timestamptz',
		default: () => 'NOW()',
	})
	scannedAt: Date;

	@Column({ name: 'token_id', type: 'uuid' })
	tokenId: string;

	@Column({ name: 'user_id', type: 'uuid', nullable: true })
	userId: string | null;

	@Column({ name: 'ip_address', type: 'inet', nullable: true })
	ipAddress: string | null;

	@Column({ name: 'user_agent', type: 'text', nullable: true })
	userAgent: string | null;

	@Column({ name: 'referrer', type: 'text', nullable: true })
	referrer: string | null;

	@ManyToOne(() => PublicTraceToken, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'token_id' })
	token: PublicTraceToken;
}
