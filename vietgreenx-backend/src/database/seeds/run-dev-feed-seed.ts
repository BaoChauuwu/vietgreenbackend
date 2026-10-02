import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { DevFeedSeedService } from './dev-feed/dev-feed-seed.service';

const runDevFeedSeed = async () => {
	const app = await NestFactory.create(SeedModule);

	try {
		console.log('🌱 Running dev feed seed...');
		await app.get(DevFeedSeedService).run();
		console.log('✅ Dev feed seed completed!');
	} catch (error) {
		console.error('❌ Error during dev feed seed:', error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
		process.exitCode = 1;
	} finally {
		await app.close();
	}
};

void runDevFeedSeed();
