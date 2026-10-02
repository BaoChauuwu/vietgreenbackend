import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';
import { ProductionLog } from './production-log.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'production_log_notes', schema: 'agriculture' })
@Index('idx_plog_note_log', ['logId'])
export class ProductionLogNote {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'log_id', type: 'uuid' })
	logId: string;

	@Column({ name: 'created_by', type: 'uuid' })
	createdBy: string;

	@Column({ name: 'note_body', type: 'text' })
	noteBody: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => ProductionLog, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'log_id' })
	log: ProductionLog;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'created_by' })
	creator: User;
}
