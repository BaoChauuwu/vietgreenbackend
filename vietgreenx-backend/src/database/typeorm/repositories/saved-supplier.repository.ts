import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { SavedSupplier } from '../entities/agriculture/saved-supplier.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SavedSupplierRepository extends BaseRepository<SavedSupplier> {
	constructor(
		@InjectRepository(SavedSupplier)
		private readonly savedSupplierRepo: Repository<SavedSupplier>,
	) {
		super(savedSupplierRepo);
	}
}
