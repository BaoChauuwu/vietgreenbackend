import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import appConfig from '@app/config/app.config';
import { TypeOrmConfigService } from '@app/database/typeorm-config.service';
import { UserSeedModule } from './users/user-seed.module';
import { DevFeedSeedModule } from './dev-feed/dev-feed-seed.module';
import databaseConfig from '@app/config/database.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [databaseConfig, appConfig],
			envFilePath: ['.env'],
		}),
		TypeOrmModule.forRootAsync({
			useClass: TypeOrmConfigService,
			dataSourceFactory: async (options: DataSourceOptions) => {
				return new DataSource(options).initialize();
			},
		}),
		UserSeedModule,
		DevFeedSeedModule,
	],
})
export class SeedModule {}
