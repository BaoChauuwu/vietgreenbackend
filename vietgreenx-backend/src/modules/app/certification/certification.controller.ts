import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateCertUploadUrlRequestDto } from './dto/requests/create-cert-upload-url.request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CertUploadUrlResponseDto } from './dto/responses/cert-upload-url.response.dto';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { CertUploadResponseDto } from './dto/responses/cert-upload.response.dto';
import { CreateCertificationRequestDto } from './dto/requests/create-certification.request.dto';
import { UpdateCertificationRequestDto } from './dto/requests/update-certification.request.dto';
import { Response } from 'express';
import { CertificationResponseDto } from './dto/responses/certification.response.dto';

@ApiTags('App / Certifications')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/certifications')
export class CertificationController {
	constructor(private readonly certificationService: CertificationService) {}

	@Post()
	@ApiOperation({
		summary: '[AUTH] Create a new certification for a green profile',
	})
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Create certification')
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateCertificationRequestDto,
	) {
		const cert = await this.certificationService.create(user, dto);
		const documentUrl = await this.certificationService.getSignedDocumentUrl(
			cert.documentUrl,
			cert.id,
		);
		return toDto(CertificationResponseDto, { ...cert, documentUrl });
	}

	@Get('profile/:greenProfileId')
	@ApiOperation({ summary: '[AUTH] List certifications for a green profile' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('List certifications')
	async findAllByProfile(
		@CurrentUser() user: User,
		@Param('greenProfileId', ParseUUIDPipe) greenProfileId: string,
	) {
		const certs = await this.certificationService.findAllByProfile(
			user,
			greenProfileId,
		);
		const result = await Promise.all(
			certs.map(async (cert) => {
				const documentUrl =
					await this.certificationService.getSignedDocumentUrl(
						cert.documentUrl,
						cert.id,
					);
				return { ...cert, documentUrl };
			}),
		);
		return toDtos(CertificationResponseDto, result);
	}

	@Get(':id')
	@ApiOperation({ summary: '[AUTH] Get details of a certification' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get certification details')
	async findOne(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const cert = await this.certificationService.findOne(user, id);
		const documentUrl = await this.certificationService.getSignedDocumentUrl(
			cert.documentUrl,
			cert.id,
		);
		return toDto(CertificationResponseDto, { ...cert, documentUrl });
	}

	@Patch(':id')
	@ApiOperation({ summary: '[AUTH] Update certification details' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Update certification')
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCertificationRequestDto,
	) {
		const cert = await this.certificationService.update(user, id, dto);
		const documentUrl = await this.certificationService.getSignedDocumentUrl(
			cert.documentUrl,
			cert.id,
		);
		return toDto(CertificationResponseDto, { ...cert, documentUrl });
	}

	@Delete(':id')
	@ApiOperation({ summary: '[AUTH] Delete a certification' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Delete certification')
	async delete(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		await this.certificationService.delete(user, id);
		return null;
	}

	@Post('upload-url')
	@ApiOperation({
		summary: '[AUTH] Get private upload URL for certification document',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get certification upload url')
	async getUploadUrl(
		@CurrentUser() user: User,
		@Body() dto: CreateCertUploadUrlRequestDto,
	) {
		const result = await this.certificationService.createUploadUrl(user, dto);
		return toDto(CertUploadUrlResponseDto, result);
	}

	@Post('upload')
	@ApiOperation({ summary: '[AUTH] Upload certification document locally' })
	@UseInterceptors(FileInterceptor('file'))
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Upload certification document locally')
	async uploadLocalFile(
		@CurrentUser() user: User,
		@UploadedFile() file: Express.Multer.File,
		@Body('storageKey') storageKey: string,
	) {
		await this.certificationService.uploadLocalfile(user, file, storageKey);
		return toDto(CertUploadResponseDto, { storageKey });
	}

	@Get('document/:certId')
	@ApiOperation({
		summary:
			'[AUTH] Securely stream private certification document (Local only)',
	})
	async streamDocument(
		@CurrentUser() user: User,
		@Param('certId', ParseUUIDPipe) certId: string,
		@Res() res: Response,
	) {
		const cert = await this.certificationService.findOne(user, certId);
		const localPath = this.certificationService.getLocalFilePath(
			cert.documentUrl,
		);
		return res.sendFile(localPath);
	}
}
