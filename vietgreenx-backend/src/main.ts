import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RedisIoAdapter } from './adapters/redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { HttpExceptionFilter } from './common/filters/error.filter';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigKeys } from './config/config-key.enum';
import { useContainer } from 'class-validator';
import { spawnSync } from 'child_process';

function startEmbeddedRedis() {
	if (process.env.EMBEDDED_REDIS !== 'true') {
		return;
	}

	const host = '127.0.0.1';
	const port = process.env.REDIS_PORT || '6379';
	process.env.REDIS_HOST = host;
	process.env.REDIS_PORT = port;

	const result = spawnSync(
		'redis-server',
		['--daemonize', 'yes', '--bind', host, '--port', port],
		{ stdio: 'inherit' },
	);

	if (result.error || result.status !== 0) {
		throw result.error ?? new Error(`redis-server exited with ${result.status}`);
	}
}

async function bootstrap() {
	startEmbeddedRedis();
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.enableCors();
	useContainer(app.select(AppModule), { fallbackOnErrors: true });

	const redisIoAdapter = new RedisIoAdapter(app);
	try {
		await redisIoAdapter.connectToRedis();
		app.useWebSocketAdapter(redisIoAdapter);
	} catch (error) {
		const logger = new Logger('Bootstrap');
		logger.warn(
			`Redis unavailable; using the default in-memory WebSocket adapter: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	app.set('trust proxy', 1);
	app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
	const configService = app.get(ConfigService<AllConfigType>);

	Sentry.init({
		dsn: configService.getOrThrow(ConfigKeys.SENTRY_DSN, { infer: true }),
		environment: process.env.NODE_ENV || 'development',
	});

	app.useStaticAssets(join(__dirname, '..', 'public'), {
		prefix: '/public/',
	});

	app.useStaticAssets(join(__dirname, '..', 'uploads'), {
		prefix: '/uploads/',
	});

	app.setGlobalPrefix(
		configService.getOrThrow(ConfigKeys.API_PREFIX, { infer: true }),
		{
			exclude: ['/'],
		},
	);

	app.useGlobalFilters(new HttpExceptionFilter(configService));

	app.useGlobalInterceptors(
		new TransformInterceptor(),
		new ErrorInterceptor(),
		new LoggingInterceptor(),
	);

	const options = new DocumentBuilder()
		.setTitle(configService.getOrThrow(ConfigKeys.APP_NAME, { infer: true }))
		.setDescription('Rally System API')
		.setVersion('1.0')
		.addBearerAuth({
			type: 'http',
			description: 'Enter JWT token',
			in: 'header',
		})
		.build();

	const isProduction =
		configService.get(ConfigKeys.NODE_ENV, { infer: true }) === 'production';
	if (!isProduction) {
		const document = SwaggerModule.createDocument(app, options);
		SwaggerModule.setup('api/docs', app, document);
	}

	const PORT = process.env.PORT
		? parseInt(process.env.PORT, 10)
		: configService.getOrThrow(ConfigKeys.APP_PORT, { infer: true }) || 3000;
	await app.listen(PORT);

	return configService;
}

bootstrap().then((configService) => {
	const logger = new Logger(AppModule.name);
	const backendDomain = configService.getOrThrow(ConfigKeys.BACKEND_DOMAIN, {
		infer: true,
	});
	const isProduction =
		configService.get(ConfigKeys.NODE_ENV, { infer: true }) === 'production';
	if (!isProduction) {
		logger.log(`URL Swagger ${backendDomain}/api/docs`);
	}
	logger.log(`Starting on ${backendDomain}`);
});
