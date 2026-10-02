import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UsePipes } from '@nestjs/common';
import { ValidationPipe } from '@app/common/pipes/validation.pipe';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { MessageService } from './message.service';
import { ConversationMemberRepository } from '@app/database/typeorm/repositories/conversation-member.repository';
import { ConfigKeys } from '@app/config/config-key.enum';

class WsSendMessageDto {
	@IsUUID()
	conversationId: string;

	@IsOptional()
	@IsString()
	body?: string;

	@IsOptional()
	@IsUUID()
	mediaId?: string;

	@IsOptional()
	@IsString()
	messageType?: string;
}

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(ChatGateway.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly messageService: MessageService,
		private readonly conversationMemberRepository: ConversationMemberRepository,
	) {}

	async handleConnection(client: Socket): Promise<void> {
		try {
			const token =
				(client.handshake.auth as Record<string, string>).token ??
				client.handshake.headers.authorization?.replace('Bearer ', '');

			if (!token) {
				client.disconnect();
				return;
			}

			const payload = await this.jwtService.verifyAsync<{ id: string }>(token, {
				secret: this.configService.getOrThrow(ConfigKeys.JWT_SECRET),
			});

			client.data.userId = payload.id;
			await client.join(`user:${payload.id}`);
			this.logger.log(`Client connected: user ${payload.id}`);
		} catch {
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket): void {
		const userId = client.data?.userId;
		if (userId) {
			this.logger.log(`Client disconnected: user ${userId}`);
		}
	}

	@SubscribeMessage('message:send')
	@UsePipes(new ValidationPipe())
	async handleSendMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() dto: WsSendMessageDto,
	): Promise<void> {
		const userId = client.data?.userId as string | undefined;
		if (!userId) {
			client.emit('error', { message: 'Unauthorized' });
			return;
		}

		try {
			const message = await this.messageService.createMessage(
				dto.conversationId,
				userId,
				{ body: dto.body, mediaId: dto.mediaId, messageType: dto.messageType },
			);

			const members = await this.conversationMemberRepository.findAll({
				where: { conversationId: dto.conversationId },
			});

			for (const member of members) {
				this.server.to(`user:${member.userId}`).emit('message:new', message);
			}
		} catch (error) {
			client.emit('error', {
				message:
					error instanceof Error ? error.message : 'Failed to send message',
			});
		}
	}
}
