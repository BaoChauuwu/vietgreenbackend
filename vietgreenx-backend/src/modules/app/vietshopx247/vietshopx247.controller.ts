import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	Headers,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Responser } from '@app/common/decorators/responser.decorator';
import { HttpUnauthorizedError } from '@app/common/errors';
import { Vsx247Service } from './vietshopx247.service';
import { Vsx247ShareRequestDto } from './dto/requests/vsx247-share.request.dto';
import { toDto } from '@app/common/transformers/dto.transformer';
import { Vsx247ShareResponseDto } from './dto/responses/vsx247-share.response.dto';
import { Vsx247ClickResponseDto } from './dto/responses/vsx247-click.response.dto';

@ApiTags('App / VietShopX247')
@Controller()
export class Vsx247Controller {
	constructor(private readonly vsx247Service: Vsx247Service) {}

	private assertWebhookSecret(secret: string | undefined): void {
		const expected = process.env.VIETSHOPX247_WEBHOOK_SECRET;
		if (!expected) {
			throw new HttpUnauthorizedError('Webhook secret not configured');
		}
		// Use constant-time comparison to prevent timing side-channel attacks.
		const secretBuf = Buffer.from(secret ?? '');
		const expectedBuf = Buffer.from(expected);
		if (
			secretBuf.length !== expectedBuf.length ||
			!timingSafeEqual(secretBuf, expectedBuf)
		) {
			throw new HttpUnauthorizedError('Invalid webhook secret');
		}
	}

	@Post('webhooks/vietshopx247/share')
	@ApiOperation({
		summary: '[WEBHOOK] Receive a product share from VietShopX247',
		description:
			'Authenticated via X-VietShopX247-Secret header. Creates a VietShopX247-sourced post on VietGreenX.',
	})
	@Responser.handle('VietShopX247 share received')
	@HttpCode(HttpStatus.CREATED)
	async receiveShare(
		@Headers('x-vietshopx247-secret') secret: string | undefined,
		@Body() dto: Vsx247ShareRequestDto,
	) {
		this.assertWebhookSecret(secret);
		const result = await this.vsx247Service.receiveShare(dto);
		return toDto(Vsx247ShareResponseDto, result);
	}

	@Post('app/vietshopx247/posts/:postId/click')
	@ApiOperation({
		summary:
			'[PUBLIC] Track external click-through on a VietShopX247 post card',
	})
	@Responser.handle('Click tracked')
	@HttpCode(HttpStatus.OK)
	async trackClick(@Param('postId', ParseUUIDPipe) postId: string) {
		const result = await this.vsx247Service.trackClick(postId);
		return toDto(Vsx247ClickResponseDto, result);
	}
}
