import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, EntityManager } from 'typeorm';
import { GreenProfile } from '../entities/agriculture/green-profile.entity';

@Injectable()
export class GreenProfileRepository extends BaseRepository<GreenProfile> {
	constructor(
		@InjectRepository(GreenProfile)
		private readonly greenProfileRepo: Repository<GreenProfile>,
	) {
		super(greenProfileRepo);
	}

	async updateLocation(
		id: string,
		latitude: number,
		longitude: number,
		manager?: EntityManager,
	): Promise<void> {
		const runner = manager ? manager : this.greenProfileRepo;
		const [{ installed: postgisInstalled }] = await runner.query<
			{ installed: boolean }[]
		>(
			`SELECT EXISTS (
				SELECT 1 FROM pg_extension WHERE extname = 'postgis'
			) AS installed`,
		);

		if (postgisInstalled) {
			await runner.query(
				`UPDATE agriculture.green_profiles
				 SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
				 WHERE id = $3`,
				[longitude, latitude, id],
			);
			return;
		}

		await runner.query(
			`UPDATE agriculture.green_profiles SET location = $1 WHERE id = $2`,
			[JSON.stringify({ latitude, longitude }), id],
		);
	}

	async findOneWithCoords(
		where: FindOptionsWhere<GreenProfile>,
		relations: string[] = [],
		manager?: EntityManager,
	): Promise<GreenProfile | null> {
		const repo = manager
			? manager.getRepository(GreenProfile)
			: this.greenProfileRepo;

		const entity = await repo.findOne({ where, relations });
		if (!entity) return null;

		const runner = manager ?? this.greenProfileRepo.manager;
		const [{ installed: postgisInstalled }] = await runner.query<
			{ installed: boolean }[]
		>(
			`SELECT EXISTS (
				SELECT 1 FROM pg_extension WHERE extname = 'postgis'
			) AS installed`,
		);

		if (!postgisInstalled) {
			const [row] = await runner.query<{ location: string | null }[]>(
				`SELECT location::text AS location
				 FROM agriculture.green_profiles
				 WHERE id = $1`,
				[entity.id],
			);
			const location = row?.location
				? (JSON.parse(row.location) as {
						latitude: number;
						longitude: number;
					})
				: null;

			return Object.assign(entity, {
				latitude: location?.latitude ?? null,
				longitude: location?.longitude ?? null,
			});
		}

		const [geo] = await runner.query<
			{ lat: number | null; lng: number | null }[]
		>(
			`SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
			 FROM agriculture.green_profiles
			 WHERE id = $1`,
			[entity.id],
		);

		return Object.assign(entity, {
			latitude: geo?.lat != null ? Number(geo.lat) : null,
			longitude: geo?.lng != null ? Number(geo.lng) : null,
		});
	}
}
