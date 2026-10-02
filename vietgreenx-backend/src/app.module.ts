import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { DataSource, DataSourceOptions } from 'typeorm';

import databaseConfig from '@app/config/database.config';
import appConfig from '@app/config/app.config';
import mailConfig from '@app/config/mail.config';
import authConfig from '@app/config/auth.config';
import fileConfig from '@app/config/file.config';
import redisConfig from '@app/config/redis.config';
import sentryConfig from '@app/config/sentry.config';
import { TypeOrmConfigService } from '@app/database/typeorm-config.service';
import { ValidationPipe } from '@app/common/pipes/validation.pipe';
import { ServicesModule } from './services/services.module';
import { CorsMiddleware } from './common/middlewares/cors.middleware';
import { OriginMiddleware } from './common/middlewares/origin.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminAuthModule } from './modules/admin/admin-auth/admin-auth.module';
import { AdminProfileModule } from './modules/admin/admin-profile/admin-profile.module';
import { ConfigKeys } from './config/config-key.enum';
import { JwtModule } from '@nestjs/jwt';
import { AllConfigType } from './config/config.type';
import { AppAuthModule } from './modules/app/app-auth/app-auth.module';
import { AccountModule } from './modules/app/account/account.module';
import { AdminCategoryModule } from './modules/admin/admin-category/admin-category.module';
import { AdminMembershipModule } from './modules/admin/admin-membership/admin-membership.module';
import { AdminUserModule } from './modules/admin/admin-user/admin-user.module';
import { CategoryModule } from './modules/app/category/category.module';
import { StatsModule } from './modules/app/stats/stats.module';
import { UserProfileModule } from './modules/app/user-profile/user-profile.module';
import { AppPostModule } from './modules/app/post/post.module';
import { AppMediaModule } from './modules/app/media/media.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountPurgeJob } from './job/account-purge.job';
import { CertificationExpiryJob } from './job/certification-expiry.job';
import { RbacModule } from './modules/rbac/rbac.module';
import { OrganizationModule } from './modules/app/organizations/organization.module';
import { AdminOrganizationModule } from './modules/admin/admin-organization/admin-organization.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { FeedModule } from './modules/app/feed/feed.module';
import { ActivityLogMiddleware } from './modules/activity-log/activity-log.middleware';
import { ShareModule } from './modules/app/share/share.module';
import { BlockModule } from './modules/app/block/block.module';
import { CommentModule } from './modules/app/comment/comment.module';
import { NotificationModule } from './modules/app/notification/notification.module';
import { AppReactionModule } from './modules/app/reaction/reaction.module';
import { FollowModule } from './modules/app/follow/follow.module';
import { CropSeasonModule } from './modules/app/crop-season/crop-season.module';
import { ProductionLogModule } from './modules/app/production-log/production-log.module';
import { GreenProfileModule } from './modules/app/green-profile/green-profile.module';
import { AppProductModule } from './modules/app/product/product.module';
import { CertificationModule } from './modules/app/certification/certification.module';
import { BatchModule } from './modules/app/batch/batch.module';
import { QrQuotaModule } from './modules/app/qr-quota/qr-quota.module';
import { QrModule } from './modules/app/qr/qr.module';
import { MediaModerationModule } from './modules/app/media-moderation/media-moderation.module';
import { TraceModule } from './modules/app/trace/trace.module';
import { ReportModule } from './modules/app/report/report.module';
import { MessageModule } from './modules/app/message/message.module';
import { ProductReviewModule } from './modules/app/product-review/product-review.module';
import { TradePostModule } from './modules/app/trade-post/trade-post.module';
import { QuotationModule } from './modules/app/quotation/quotation.module';
import { SupplierModule } from './modules/app/supplier/supplier.module';
import { SearchModule } from './modules/app/search/search.module';
import { AdminModerationModule } from './modules/admin/admin-moderation/admin-moderation.module';
import { AdminCertificationModule } from './modules/admin/admin-certification/admin-certification.module';
import { AdminProductModule } from './modules/admin/admin-product/admin-product.module';
import { AdminDashboardModule } from './modules/admin/admin-dashboard/admin-dashboard.module';
import { Vsx247Module } from './modules/app/vietshopx247/vietshopx247.module';
import { MembershipModule } from './modules/app/membership/membership.module';
import { SubscriptionExpiryJob } from './job/subscription-expiry.job';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [
				databaseConfig,
				appConfig,
				authConfig,
				fileConfig,
				mailConfig,
				redisConfig,
				sentryConfig,
			],
			envFilePath: ['.env'],
		}),
		ThrottlerModule.forRoot([
			{
				ttl: minutes(5),
				limit: 600,
				ignoreUserAgents: [/googlebot/gi, /bingbot/gi, /baidubot/gi],
				skipIf: () => false,
			},
		]),
		TypeOrmModule.forRootAsync({
			useClass: TypeOrmConfigService,
			dataSourceFactory: async (options: DataSourceOptions) => {
				return new DataSource(options).initialize();
			},
		}),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AllConfigType>) => ({
				secret: configService.get(ConfigKeys.JWT_SECRET, {
					infer: true,
				}),
				signOptions: {
					expiresIn: configService.get(ConfigKeys.JWT_EXPIRES, {
						infer: true,
					}),
				},
			}),
			global: true,
		}),
		EventEmitterModule.forRoot(),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: configService.get<string>(ConfigKeys.REDIS_HOST) || 'localhost',
					port: configService.get<number>(ConfigKeys.REDIS_PORT) || 6379,
				},
			}),
		}),
		ServicesModule,
		AdminAuthModule,
		AdminProfileModule,
		AppAuthModule,
		AccountModule,
		AdminCategoryModule,
		AdminMembershipModule,
		CategoryModule,
		StatsModule,
		UserProfileModule,
		AppPostModule,
		AppMediaModule,
		OrganizationModule,
		AdminOrganizationModule,
		ScheduleModule.forRoot(),
		AdminUserModule,
		RbacModule,
		AuditLogModule,
		ActivityLogModule,
		FeedModule,
		ShareModule,
		BlockModule,
		CommentModule,
		NotificationModule,
		AppReactionModule,
		FollowModule,
		CropSeasonModule,
		ProductionLogModule,
		GreenProfileModule,
		AppProductModule,
		CertificationModule,
		BatchModule,
		QrQuotaModule,
		QrModule,
		MediaModerationModule,
		TraceModule,
		ReportModule,
		MessageModule,
		ProductReviewModule,
		TradePostModule,
		QuotationModule,
		SupplierModule,
		SearchModule,
		AdminModerationModule,
		AdminCertificationModule,
		AdminProductModule,
		AdminDashboardModule,
		Vsx247Module,
		MembershipModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_PIPE,
			useClass: ValidationPipe,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: AuditLogInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ActivityLogInterceptor,
		},
		AccountPurgeJob,
		CertificationExpiryJob,
		SubscriptionExpiryJob,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(CorsMiddleware, OriginMiddleware, ActivityLogMiddleware)
			.forRoutes('*');
	}
}
