import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepo: Repository<Notification>,
	) {
		super(notificationRepo);
	}
}
