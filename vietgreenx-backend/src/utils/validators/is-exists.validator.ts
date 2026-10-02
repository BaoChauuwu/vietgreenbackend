import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
	constructor(
		@InjectDataSource()
		private dataSource: DataSource,
	) {}

	async validate(value: string, validationArguments: ValidationArguments) {
		const repository = validationArguments.constraints[0];
		const pathToProperty = validationArguments.constraints[1];

		const fieldName = pathToProperty
			? pathToProperty
			: validationArguments.property;
		const compareValue =
			pathToProperty && typeof value === 'object' && value !== null
				? (value as any)[pathToProperty]
				: (value as any);

		if (typeof compareValue === 'undefined' || compareValue === null) {
			return false;
		}

		const entity: unknown = await this.dataSource
			.getRepository(repository)
			.findOne({
				where: {
					[fieldName]: compareValue,
				},
			});

		return Boolean(entity);
	}
}
