import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { PostSource } from '@app/common/enums/post-source.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import {
	ErrorCode,
	HttpNotFoundError,
	HttpBadRequestError,
} from '@app/common/errors';
import { Vsx247ShareRequestDto } from './dto/requests/vsx247-share.request.dto';

@Injectable()
export class Vsx247Service {
	constructor(
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,
		private readonly userRepository: UserRepository,
		private readonly dataSource: DataSource,
	) {}

	async receiveShare(dto: Vsx247ShareRequestDto) {
		const user = await this.userRepository.findOne({ id: dto.vgxUserId });
		if (!user) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}
		if (user.status !== UserStatus.ACTIVE) {
			throw new HttpBadRequestError(ErrorCode.VSX247_USER_INACTIVE);
		}

		const post = await this.postRepository.save(
			this.postRepository.create({
				authorId: dto.vgxUserId,
				body: null,
				visibility: VisibilityType.PUBLIC,
				isDraft: false,
				source: PostSource.VIETSHOPX247,
				sourceMetadata: {
					productId: dto.productId,
					productName: dto.productName,
					productImageUrl: dto.productImageUrl ?? null,
					productPrice: dto.productPrice ?? null,
					priceCurrency: dto.priceCurrency ?? 'VND',
					storeName: dto.storeName,
					storeId: dto.storeId,
					categoryName: dto.categoryName ?? null,
				},
				externalUrl: dto.externalUrl,
				externalClickCount: 0,
			}),
		);

		return {
			postId: post.id,
			authorId: post.authorId,
			source: post.source,
			externalUrl: post.externalUrl,
			sourceMetadata: post.sourceMetadata,
			createdAt: post.createdAt,
		};
	}

	async trackClick(postId: string) {
		const post = await this.postRepository.findOne({ where: { id: postId } });
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}
		if (post.source !== PostSource.VIETSHOPX247) {
			throw new HttpBadRequestError(ErrorCode.VSX247_CLICK_INVALID_POST);
		}

		await this.dataSource.query(
			`UPDATE content.posts SET external_click_count = external_click_count + 1 WHERE id = $1`,
			[postId],
		);

		return { postId, tracked: true };
	}
}
