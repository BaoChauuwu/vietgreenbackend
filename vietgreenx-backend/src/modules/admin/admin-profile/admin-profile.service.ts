import { Injectable } from '@nestjs/common';
import { AdminProfileResponseDto } from './dto/responses/admin-profile.response.dto';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { toDto } from '@app/common/transformers/dto.transformer';
import { ErrorCode } from '@app/common/errors/error-code';
import { User } from '@app/database/typeorm/entities';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';

@Injectable()
export class AdminProfileService {
	constructor(private readonly userRepository: UserRepository) {}

	async findProfile(user: User): Promise<AdminProfileResponseDto> {
		const userData = await this.userRepository.findById(user.id);
		if (!userData) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		return toDto(AdminProfileResponseDto, userData);
	}
}
