import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities';

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
	constructor(
		@InjectRepository(Comment)
		private readonly commentRepo: Repository<Comment>,
	) {
		super(commentRepo);
	}
}
