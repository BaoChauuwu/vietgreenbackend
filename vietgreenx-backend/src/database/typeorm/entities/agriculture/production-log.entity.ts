import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';
import { ActivityType } from '@app/common/enums/activity-type.enum';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { CropSeason } from './crop-season.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'production_logs', schema: 'agriculture' })
@Index('idx_plog_season', ['cropSeasonId'])
@Index('idx_plog_activity', ['activityType'])
@Index('idx_plog_date', ['logDate'])
@Index('idx_plog_creator', ['createdBy'])
export class ProductionLog {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'crop_season_id', type: 'uuid' })
	cropSeasonId: string;

	@Column({ name: 'created_by', type: 'uuid' })
	createdBy: string;

	@Column({ name: 'log_date', type: 'date' })
	logDate: string;

	@Column({
		name: 'activity_type',
		type: 'enum',
		enum: ActivityType,
		enumName: 'activity_type',
	})
	activityType: ActivityType;

	@Column({ name: 'input_material', type: 'text', nullable: true })
	inputMaterial: string | null;

	@Column({ name: 'dosage', type: 'text', nullable: true })
	dosage: string | null;

	@Column({ name: 'dosage_unit', type: 'text', nullable: true })
	dosageUnit: string | null;

	@Column({ name: 'notes', type: 'text', nullable: true })
	notes: string | null;

	@Column({ name: 'weather', type: 'text', nullable: true })
	weather: string | null;

	@Column({ name: 'pest_status', type: 'text', nullable: true })
	pestStatus: string | null;

	@Column({
		name: 'estimated_yield',
		type: 'decimal',
		precision: 12,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	estimatedYield: number | null;

	@Column({ name: 'media_ids', type: 'uuid', array: true, default: '{}' })
	mediaIds: string[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => CropSeason, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'crop_season_id' })
	cropSeason: CropSeason;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'created_by' })
	creator: User;
}
