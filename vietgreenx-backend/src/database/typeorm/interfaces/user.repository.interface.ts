import { User } from '../entities';
import { IBaseRepository } from './base.repository.interface';

export type IUserRepository = IBaseRepository<User>;
