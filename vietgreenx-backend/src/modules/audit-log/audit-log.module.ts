import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@app/database/typeorm/entities';
import { AuditLogService } from './audit-log.service';

@Module({
	imports: [TypeOrmModule.forFeature([AuditLog])],
	providers: [AuditLogService],
	exports: [AuditLogService],
})
export class AuditLogModule {}
