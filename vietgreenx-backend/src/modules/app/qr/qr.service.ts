import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument: any = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode: any = require('qrcode');

const FONT_PATH = path.join(
	process.cwd(),
	'src/assets/fonts/NotoSans-Regular.ttf',
);
import { EntityManager, DeepPartial, In } from 'typeorm';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { QrQuotaService } from '../qr-quota/qr-quota.service';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { PublicTraceToken } from '@app/database/typeorm/entities/agriculture/public-trace-token.entity';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
import { BatchStatus } from '@app/common/enums/batch-status.enum';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { ListQrTokensRequestDto } from './dto/requests/list-qr-tokens.request.dto';
import { GenerateQrRequestDto } from './dto/requests/generate-qr.request.dto';
import { ExportQrPdfRequestDto } from './dto/requests/export-pdf.request.dto';

@Injectable()
export class QrService {
	constructor(
		private readonly publicTraceTokenRepository: PublicTraceTokenRepository,
		private readonly batchRepository: BatchRepository,
		private readonly qrQuotaService: QrQuotaService,
	) {}

	async listTokens(user: User, dto: ListQrTokensRequestDto) {
		const base: Record<string, unknown> = { createdBy: user.id };
		if (dto.targetType) base.targetType = dto.targetType;

		let where: Record<string, unknown> | Record<string, unknown>[] = base;

		if (dto.productId) {
			const batches = await this.batchRepository.findAll({
				where: { productId: dto.productId, createdBy: user.id },
				select: ['id'],
			});
			const batchIds = batches.map((b) => b.id);

			if (batchIds.length > 0) {
				where = [
					{ ...base, productId: dto.productId },
					{ ...base, batchId: In(batchIds) },
				];
			} else {
				where = { ...base, productId: dto.productId };
			}
		} else if (dto.batchId) {
			where = { ...base, batchId: dto.batchId };
		}

		return this.publicTraceTokenRepository.findWithPagination(
			dto.page ?? 1,
			dto.limit ?? 20,
			{ where, order: { createdAt: 'DESC' } },
		);
	}

	async generateForBatch(
		user: User,
		dto: GenerateQrRequestDto,
	): Promise<PublicTraceToken> {
		if (!dto.batchId) {
			throw new HttpBadRequestError(ErrorCode.BATCH_NOT_FOUND);
		}

		const batch = await this.batchRepository.findOne({ id: dto.batchId });
		if (!batch) {
			throw new HttpNotFoundError(ErrorCode.BATCH_NOT_FOUND);
		}
		if (batch.createdBy !== user.id) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}
		if (
			![BatchStatus.CREATED, BatchStatus.QR_GENERATED].includes(batch.status)
		) {
			throw new HttpBadRequestError(ErrorCode.BATCH_INVALID_STATE_TRANSITION);
		}

		return this.batchRepository.executeInTransaction(
			async (manager: EntityManager) => {
				await this.qrQuotaService.checkAndDeductQuota(user, 1, manager);

				const tokenData: DeepPartial<PublicTraceToken> = {
					batchId: batch.id,
					targetType: 'batch',
					createdBy: user.id,
				};
				const entity = manager.create(PublicTraceToken, tokenData);
				const saved = await manager.save(PublicTraceToken, entity);

				if (batch.status === BatchStatus.CREATED) {
					await manager.update(
						Batch,
						{ id: batch.id },
						{ status: BatchStatus.QR_GENERATED },
					);
				}

				return saved;
			},
		);
	}

	async exportPdf(
		user: User,
		dto: ExportQrPdfRequestDto,
		res: Response,
	): Promise<void> {
		const tokens = await this.publicTraceTokenRepository.findAll({
			where: { createdBy: user.id },
			relations: ['batch', 'batch.product', 'product'],
		});

		const selected = tokens.filter((t) => dto.tokenIds.includes(t.id));
		if (selected.length === 0) {
			res.status(404).json({ message: 'No tokens found' });
			return;
		}

		// Label size: 5cm x 5cm at 72dpi (PDFKit uses points: 1pt = 1/72 inch, 1cm = 28.35pt)
		const CM = 28.3465;
		const labelW = 5 * CM; // ~141.7pt
		const labelH = 5 * CM;
		const cols = dto.layout === 4 ? 2 : dto.layout === 9 ? 3 : 4;
		const rows = Math.ceil(dto.layout / cols);
		const margin = 1 * CM;
		const pageW = cols * labelW + (cols + 1) * margin;
		const pageH = rows * labelH + (rows + 1) * margin;

		const doc = new PDFDocument({ size: [pageW, pageH], margin: 0 });
		doc.registerFont('NotoSans', FONT_PATH);

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="qr-labels-${Date.now()}.pdf"`,
		);
		doc.pipe(res);

		const qrSize = labelW * 0.55;
		const fontSize = 6;

		for (let i = 0; i < selected.length; i++) {
			const token = selected[i];
			const colIdx = i % cols;
			const rowIdx = Math.floor(i / cols);

			if (i > 0 && i % dto.layout === 0) {
				doc.addPage({ size: [pageW, pageH], margin: 0 });
			}

			const x = margin + colIdx * (labelW + margin);
			const y = margin + rowIdx * (labelH + margin);

			// QR code
			const qrDataUrl = await QRCode.toDataURL(
				`${process.env.APP_BASE_URL ?? 'https://vietgreenx.vn'}/trace/${token.token}`,
				{ width: 300, margin: 1 },
			);
			const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
			doc.image(qrBuffer, x + (labelW - qrSize) / 2, y + 2, {
				width: qrSize,
				height: qrSize,
			});

			// Text below QR
			const product = token.product ?? token.batch?.product;
			const batchCode = token.batch?.batchCode ?? null;
			const textY = y + 2 + qrSize + 3;

			doc.font('NotoSans').fontSize(fontSize).fillColor('#000000');
			if (product?.name) {
				doc.text(product.name, x + 2, textY, {
					width: labelW - 4,
					align: 'center',
				});
			}
			if (batchCode) {
				doc.text(`Lô: ${batchCode}`, x + 2, textY + fontSize + 2, {
					width: labelW - 4,
					align: 'center',
				});
			}
		}

		doc.end();
	}
}
