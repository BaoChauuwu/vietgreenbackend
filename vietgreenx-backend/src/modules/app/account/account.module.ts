import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';

@Module({
	imports: [TypeOrmModule.forFeature([User]), AppAuthModule],
	controllers: [AccountController],
	providers: [AccountService, UserRepository],
	exports: [AccountService],
})
export class AccountModule {}
