import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from '@app/database/typeorm/entities/social-graph/block.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { BlockRepository } from '@app/database/typeorm/repositories/block.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';

@Module({
	imports: [TypeOrmModule.forFeature([Block, Follow, User]), AppAuthModule],
	controllers: [BlockController],
	providers: [BlockService, BlockRepository, UserRepository],
	exports: [BlockService],
})
export class BlockModule {}
