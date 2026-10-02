import { Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import { HttpBadRequestError } from '@app/common/errors';

@Injectable()
export class MultipleFileValidationPipe implements PipeTransform {
	private readonly allowedExtensions: string[] = [
		'.jpg',
		'.png',
		'.jpeg',
		'.pdf',
	];
	private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB

	async transform(value: Express.Multer.File[]) {
		if (!value || (Array.isArray(value) && value.length === 0)) {
			throw new HttpBadRequestError('No files provided');
		}

		if (Array.isArray(value)) {
			return await this.validateFilesArray(value);
		}

		if (this.isFileFieldsObject(value)) {
			return await this.validateFileFieldsObject(value);
		}

		throw new HttpBadRequestError('Invalid file upload format');
	}

	private isFileFieldsObject(value: any): boolean {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	private async validateFilesArray(
		files: Express.Multer.File[],
	): Promise<Express.Multer.File[]> {
		return Promise.all(files.map((file) => this.validateFile(file)));
	}

	private async validateFileFieldsObject(files: {
		[key: string]: Express.Multer.File[];
	}): Promise<{ [key: string]: Express.Multer.File[] }> {
		const validatedFiles: { [key: string]: Express.Multer.File[] } = {};

		for (const [field, fileArray] of Object.entries(files)) {
			if (fileArray && fileArray.length > 0) {
				validatedFiles[field] = await this.validateFilesArray(fileArray);
			}
		}

		return validatedFiles;
	}

	private async validateFile(
		file: Express.Multer.File,
	): Promise<Express.Multer.File> {
		await this.validateFileName(file);
		await this.validateFileExtension(file);
		await this.validateFileSize(file);
		return file;
	}

	private async validateFileName(file: Express.Multer.File): Promise<void> {
		if (!file.originalname) {
			await this.deleteFile(file);
			throw new HttpBadRequestError('File name is missing');
		}
	}

	private async validateFileExtension(
		file: Express.Multer.File,
	): Promise<void> {
		const fileExtension = extname(file.originalname).toLowerCase();
		if (!this.allowedExtensions.includes(fileExtension)) {
			await this.deleteFile(file);
			throw new HttpBadRequestError(
				`Invalid file type. Allowed extensions are: ${this.allowedExtensions.join(', ')}`,
			);
		}
	}

	private async validateFileSize(file: Express.Multer.File): Promise<void> {
		if (file.size > this.maxFileSize) {
			await this.deleteFile(file);
			throw new HttpBadRequestError(
				`File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`,
			);
		}
	}

	private async deleteFile(file: Express.Multer.File): Promise<void> {
		if (file.path) {
			await fs.promises.unlink(file.path).catch(() => undefined);
		}
	}
}
