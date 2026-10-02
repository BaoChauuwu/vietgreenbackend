import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Order } from '../entities/agriculture/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepo: Repository<Order>,
	) {
		super(orderRepo);
	}
}
