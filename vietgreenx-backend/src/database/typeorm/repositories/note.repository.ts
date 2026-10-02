import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionLogNote } from '../entities';
@Injectable()
export class ProductionLogNoteRepository extends BaseRepository<ProductionLogNote> {
	constructor(
		@InjectRepository(ProductionLogNote)
		private readonly noteRepo: Repository<ProductionLogNote>,
	) {
		super(noteRepo);
	}
}
