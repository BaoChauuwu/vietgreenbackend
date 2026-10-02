import { Module } from '@nestjs/common';
import { AdminProfileService } from './admin-profile.service';
import { AdminProfileController } from './admin-profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
	controllers: [AdminProfileController],
	providers: [AdminProfileService, UserRepository],
})
export class AdminProfileModule {}
