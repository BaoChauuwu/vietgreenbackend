import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { TraceHashRepository } from '@app/database/typeorm/repositories/trace-hash.repository';

@Injectable()
export class HashService {
	constructor(private readonly traceHashRepository: TraceHashRepository) {}

	private computeHash(data: object, prevHash: string | null): string {
		const payload = JSON.stringify({ data, prevHash: prevHash ?? '' });
		return crypto.createHash('sha256').update(payload).digest('hex');
	}

	async recordHash(
		entityType: string,
		entityId: string,
		data: object,
	): Promise<void> {
		const latest = await this.traceHashRepository.findLatestForEntity(
			entityType,
			entityId,
		);
		const prevHash = latest?.hash ?? null;
		const chainIndex = latest ? latest.chainIndex + 1 : 0;
		const hash = this.computeHash(data, prevHash);

		await this.traceHashRepository.create({
			entityType,
			entityId,
			hash,
			prevHash,
			chainIndex,
		});
	}

	async verifyChain(
		entityType: string,
		entityId: string,
	): Promise<{ isVerified: boolean; chainLength: number }> {
		const entries = await this.traceHashRepository.findAllForEntity(
			entityType,
			entityId,
		);
		if (entries.length === 0) {
			return { isVerified: false, chainLength: 0 };
		}

		// Verify chain integrity by checking prevHash links
		for (let i = 1; i < entries.length; i++) {
			if (entries[i].prevHash !== entries[i - 1].hash) {
				return { isVerified: false, chainLength: entries.length };
			}
		}

		return { isVerified: true, chainLength: entries.length };
	}

	async getVerificationStatus(entityType: string, entityId: string) {
		const latest = await this.traceHashRepository.findLatestForEntity(
			entityType,
			entityId,
		);
		if (!latest) return null;

		const { isVerified, chainLength } = await this.verifyChain(
			entityType,
			entityId,
		);
		return {
			isVerified,
			chainLength,
			lastVerifiedAt: latest.createdAt,
		};
	}
}
