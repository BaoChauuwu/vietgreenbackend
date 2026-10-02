import { Global, Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { S3Service } from './aws/s3/s3.service';
import { S3ClientProvider } from './aws/s3/s3-client.provider';
import { RedisService } from './redis/redis.service';
import { OtpService } from './otp/otp.service';
import { FcmService } from './fcm/fcm.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Profile } from '@app/database/typeorm/entities';
import { FcmDevice } from '@app/database/typeorm/entities/identity/fcm-device.entity';

const providers = [
	EmailService,
	S3ClientProvider,
	S3Service,
	RedisService,
	OtpService,
	FcmService,
	UserRepository,
	ProfileRepository,
	FcmDeviceRepository,
];

@Global()
@Module({
	imports: [TypeOrmModule.forFeature([User, Profile, FcmDevice])],
	providers,
	exports: providers,
})
export class ServicesModule {}
