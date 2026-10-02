import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Vsx247Service } from './vietshopx247.service';
import { Vsx247Controller } from './vietshopx247.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Post, User])],
	controllers: [Vsx247Controller],
	providers: [Vsx247Service, UserRepository],
})
export class Vsx247Module {}
