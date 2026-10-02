import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter>;

	async connectToRedis(): Promise<void> {
		const host = process.env.REDIS_HOST || 'localhost';
		const port = parseInt(process.env.REDIS_PORT || '6379', 10);
		const password = process.env.REDIS_PASSWORD || undefined;

		const pubClient = new Redis({
			host,
			port,
			password,
			lazyConnect: true,
			connectTimeout: 5_000,
			retryStrategy: () => null,
		});
		const subClient = pubClient.duplicate();

		try {
			await Promise.all([pubClient.connect(), subClient.connect()]);
		} catch (error) {
			pubClient.disconnect();
			subClient.disconnect();
			throw error;
		}

		this.adapterConstructor = createAdapter(pubClient, subClient);
	}

	createIOServer(port: number, options?: ServerOptions): any {
		const server = super.createIOServer(port, options);
		server.adapter(this.adapterConstructor);
		return server;
	}
}
