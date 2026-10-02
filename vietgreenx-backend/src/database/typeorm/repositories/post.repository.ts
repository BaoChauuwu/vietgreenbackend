import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Post } from '../entities/content/post.entity';

@Injectable()
export class PostRepository extends BaseRepository<Post> {
	constructor(
		@InjectRepository(Post)
		private readonly postRepo: Repository<Post>,
	) {
		super(postRepo);
	}
}
