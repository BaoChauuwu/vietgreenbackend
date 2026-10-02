import { Injectable } from '@nestjs/common';
import { CreateReportRequestDto } from './dto/requests/create-report.request.dto';
import { ReportRepository } from '@app/database/typeorm/repositories/report.repository';
import { ReportTargetType } from '@app/common/enums/report-target-type.enum';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpNotFoundError,
} from '@app/common/errors';
import { BlockService } from '@app/modules/app/block/block.service';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import { In } from 'typeorm';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@Injectable()
export class ReportService {
	constructor(
		private readonly reportRepository: ReportRepository,
		private readonly blockService: BlockService,
		private readonly postRepository: PostRepository,
		private readonly commentRepository: CommentRepository,
		private readonly userRepository: UserRepository,
		private readonly productRepository: ProductRepository,
	) {}

	async createReport(reporterId: string, dto: CreateReportRequestDto) {
		const { targetType, targetId, reason, details } = dto;

		if (targetType === ReportTargetType.USER && targetId === reporterId) {
			throw new HttpBadRequestError(ErrorCode.CANNOT_REPORT_SELF);
		}

		const existingReport = await this.reportRepository.findOne({
			reporterId,
			targetType,
			targetId,
			status: In([ReportStatus.PENDING, ReportStatus.UNDER_REVIEW]),
		});

		if (existingReport) {
			throw new HttpBadRequestError(ErrorCode.REPORT_ALREADY_EXISTS);
		}

		switch (targetType) {
			case ReportTargetType.POST: {
				const post = await this.postRepository.findOne({ id: targetId });
				if (!post) {
					throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
				}
				if (post.authorId === reporterId) {
					throw new HttpBadRequestError(ErrorCode.CANNOT_REPORT_SELF);
				}
				const isBlocked = await this.blockService.isEitherBlocked(
					reporterId,
					post.authorId,
				);
				if (isBlocked) {
					throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
				}
				break;
			}
			case ReportTargetType.COMMENT: {
				const comment = await this.commentRepository.findOne({ id: targetId });
				if (!comment) {
					throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
				}
				if (comment.authorId === reporterId) {
					throw new HttpBadRequestError(ErrorCode.CANNOT_REPORT_SELF);
				}
				const isBlocked = await this.blockService.isEitherBlocked(
					reporterId,
					comment.authorId,
				);
				if (isBlocked) {
					throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
				}
				break;
			}
			case ReportTargetType.USER: {
				const user = await this.userRepository.findOne({ id: targetId });
				if (!user) {
					throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
				}
				const isBlocked = await this.blockService.isEitherBlocked(
					reporterId,
					targetId,
				);
				if (isBlocked) {
					throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
				}
				break;
			}
			case ReportTargetType.PRODUCT: {
				const product = await this.productRepository.findOne({ id: targetId });
				if (!product) {
					throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
				}
				if (product.ownerUserId === reporterId) {
					throw new HttpBadRequestError(ErrorCode.CANNOT_REPORT_SELF);
				}
				if (product.ownerUserId) {
					const isBlocked = await this.blockService.isEitherBlocked(
						reporterId,
						product.ownerUserId,
					);
					if (isBlocked) {
						throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
					}
				}
				break;
			}
			default:
				throw new HttpBadRequestError(ErrorCode.INTERNAL_SERVER_ERROR);
		}

		const report = await this.reportRepository.create({
			reporterId,
			targetType,
			targetId,
			reason,
			details: details || null,
			status: ReportStatus.PENDING,
			isPriority: false,
		});

		const reportCount = await this.reportRepository.count({
			targetType,
			targetId,
		});
		if (reportCount >= 5) {
			await this.reportRepository.updateWhere(
				{ targetType, targetId, isPriority: false },
				{ isPriority: true },
			);
		}

		return report;
	}

	async getList(userId: string, query: PaginationDto) {
		return await this.reportRepository.findWithPagination(
			query.page,
			query.limit,
			{
				where: { reporterId: userId },
				order: { createdAt: 'DESC' },
			},
		);
	}
}
