import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ValidationError } from '@app/common/errors/validation.error';

export const isUnverifiableMetaType = (
	metatype: any,
): metatype is undefined => {
	const basicTypes = [String, Boolean, Number, Array, Object];
	return !metatype || basicTypes.includes(metatype);
};

/**
 * @class ValidationPipe
 * @classdesc validate meta type class format
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
	async transform(value: any, { metatype }: ArgumentMetadata) {
		if (
			isUnverifiableMetaType(metatype) ||
			value === undefined ||
			value === null
		) {
			return value;
		}
		const object = plainToInstance(metatype, value);
		const errors = await validate(object, { forbidUnknownValues: false });
		if (errors.length > 0) {
			const messages: string[] = [];
			const pushMessage = (constraints = {}) => {
				messages.push(...Object.values<any>(constraints));
			};

			errors.forEach((error) => {
				if (error.constraints) {
					pushMessage(error.constraints);
				}
				// MARK: keep 1 level > Maximum call stack
				if (error.children) {
					error.children.forEach((e) => pushMessage(e.constraints));

					error.children.forEach((e) => {
						pushMessage(e.constraints);
						if (e.children) {
							e.children.forEach((e) => pushMessage(e.constraints));
						}
					});
				}
			});

			throw new ValidationError(messages.join(', '));
		}

		return object;
	}
}
