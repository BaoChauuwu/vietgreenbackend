import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashService } from './hash.service';
import { TraceHash } from '@app/database/typeorm/entities/agriculture/trace-hash.entity';
import { TraceHashRepository } from '@app/database/typeorm/repositories/trace-hash.repository';

@Module({
	imports: [TypeOrmModule.forFeature([TraceHash])],
	providers: [HashService, TraceHashRepository],
	exports: [HashService],
})
export class HashModule {}
