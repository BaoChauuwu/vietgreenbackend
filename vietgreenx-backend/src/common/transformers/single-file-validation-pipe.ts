import { Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import { HttpBadRequestError } from '@app/common/errors';

@Injectable()
export class SingleFileValidationPipe implements PipeTransform {
	private readonly allowedExtensions: string[] = [
		'.jpg',
		'.png',
		'.jpeg',
		'.pdf',
	];
	private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB

	async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
		if (!file) {
			throw new HttpBadRequestError('No file provided');
		}

		const fileExtension = extname(file.originalname).toLowerCase();
		if (!this.allowedExtensions.includes(fileExtension)) {
			await this.deleteFile(file);
			throw new HttpBadRequestError(
				`Invalid file type. Allowed extensions are: ${this.allowedExtensions.join(', ')}`,
			);
		}

		if (file.size > this.maxFileSize) {
			await this.deleteFile(file);
			throw new HttpBadRequestError(
				`File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)}MB.`,
			);
		}

		return file;
	}

	private async deleteFile(file: Express.Multer.File): Promise<void> {
		if (file.path) {
			await fs.promises.unlink(file.path).catch(() => undefined);
		}
	}
}
