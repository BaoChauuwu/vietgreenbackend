import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';

import { UserSeedService } from './users/user-seed.service';

const runSeed = async () => {
	const app = await NestFactory.create(SeedModule);

	try {
		console.log('🌱 Running database seed...');
		await app.get(UserSeedService).run();
		console.log('✅ Seeding completed successfully!');
	} catch (error) {
		console.error('❌ Error during seeding:', error);
		console.error(error.stack);
	} finally {
		await app.close();
	}
};

void runSeed();
