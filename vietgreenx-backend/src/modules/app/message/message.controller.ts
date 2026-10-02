import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities';
import { CreateDirectConversationRequestDto } from './dto/requests/create-direct-conversation.request.dto';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { CreateDirectConversationResponseDto } from './dto/responses/create-direct-conservation.response.dto';
import { GetConversationsQueryRequestDto } from './dto/requests/get-conversations-query.request.dto';
import { ConversationsResponseDto } from './dto/responses/conversations.response.dto';
import { CreateMessageRequestDto } from './dto/requests/create-message.request.dto';
import { CreateMessageResponseDto } from './dto/responses/create-message.response.dto';
import { GetMessagesQueryRequestDto } from './dto/requests/get-messages-query.request.dto';
import { MessagesResponseDto } from './dto/responses/messages.response.dto';
import { ConversationResponseDto } from './dto/responses/conversation.response.dto';
import { MessageResponseDto } from './dto/responses/message.response.dto';

@ApiTags('App / Conversations')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/conversations')
export class MessageController {
	constructor(private readonly messageService: MessageService) {}

	@Post()
	@ApiOperation({ summary: '[AUTH] create conversation' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Conversation created successfully')
	async createConversation(
		@CurrentUser() user: User,
		@Body() dto: CreateDirectConversationRequestDto,
	) {
		const result = await this.messageService.createConversation(user.id, dto);
		return toDto(CreateDirectConversationResponseDto, result);
	}

	@Get()
	@ApiOperation({ summary: "[AUTH] get list user's conversations" })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('conversations retrieved successfully')
	async getMyConversation(
		@CurrentUser() user: User,
		@Query() query: GetConversationsQueryRequestDto,
	) {
		const result = await this.messageService.getMyConversation(user.id, query);
		return toDto(ConversationsResponseDto, {
			items: toDtos(ConversationResponseDto, result.data),
			nextCursor: result.nextCursor ?? null,
			hasNext: result.hasNext,
			limit: result.limit,
		});
	}

	@Post(':id/messages')
	@ApiOperation({ summary: '[AUTH] create/send a message' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Send a message')
	async createMessage(
		@Param('id', ParseUUIDPipe) conversationId: string,
		@CurrentUser() user: User,
		@Body() dto: CreateMessageRequestDto,
	) {
		const result = await this.messageService.createMessage(
			conversationId,
			user.id,
			dto,
		);

		return toDto(CreateMessageResponseDto, result);
	}

	@Post(':id/read')
	@ApiOperation({ summary: '[AUTH] Mark all messages in conversation as read' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Conversation marked as read')
	async markConversationRead(
		@Param('id', ParseUUIDPipe) conversationId: string,
		@CurrentUser() user: User,
	) {
		await this.messageService.markConversationRead(conversationId, user.id);
	}

	@Get(':id/messages')
	@ApiOperation({ summary: '[AUTH] List messages in conversation' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Messages retrieved successfully')
	async getMessages(
		@Param('id', ParseUUIDPipe) conversationId: string,
		@CurrentUser() user: User,
		@Query() dto: GetMessagesQueryRequestDto,
	) {
		const result = await this.messageService.getMessages(
			conversationId,
			user.id,
			dto,
		);

		return toDto(MessagesResponseDto, {
			items: toDtos(MessageResponseDto, result.data),
			nextCursor: result.nextCursor ?? null,
			hasNext: result.hasNext,
			limit: result.limit,
		});
	}
}
