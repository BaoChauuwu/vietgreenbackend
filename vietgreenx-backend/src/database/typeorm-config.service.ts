import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseType } from 'typeorm';
import { ConfigKeys } from '@app/config/config-key.enum';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
	constructor(private configService: ConfigService) {}

	createTypeOrmOptions(): TypeOrmModuleOptions {
		return {
			type:
				(this.configService.get(ConfigKeys.DATABASE_TYPE) as DatabaseType) ||
				'postgres',
			host: this.configService.get(ConfigKeys.DATABASE_HOST),
			port: this.configService.get(ConfigKeys.DATABASE_PORT),
			username: this.configService.get(ConfigKeys.DATABASE_USERNAME),
			password: this.configService.get(ConfigKeys.DATABASE_PASSWORD),
			database: this.configService.get(ConfigKeys.DATABASE_NAME),
			synchronize: this.configService.get(ConfigKeys.DATABASE_SYNCHRONIZE),
			dropSchema: false,
			logging: this.configService.get(ConfigKeys.NODE_ENV) !== 'production',
			entities: [__dirname + '/../**/*.entity{.ts,.js}'],
			migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
			extra: {
				// max connection pool size
				// Use 'connectionLimit' for MySQL, 'max' for PostgreSQL
				connectionLimit: this.configService.get(
					ConfigKeys.DATABASE_MAX_CONNECTIONS,
				),
				ssl: this.configService.get(ConfigKeys.DATABASE_SSL_ENABLED)
					? {
							rejectUnauthorized: this.configService.get(
								ConfigKeys.DATABASE_REJECT_UNAUTHORIZED,
							),
							ca: this.configService.get(ConfigKeys.DATABASE_CA) ?? undefined,
							key: this.configService.get(ConfigKeys.DATABASE_KEY) ?? undefined,
							cert:
								this.configService.get(ConfigKeys.DATABASE_CERT) ?? undefined,
						}
					: undefined,
			},
		} as TypeOrmModuleOptions;
	}
}
