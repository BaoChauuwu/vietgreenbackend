import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from 'class-validator';

export function IsXor(fields: string[], validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'isXor',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [fields],
			options: {
				message: `Exactly one of these field must be provide ${fields.join(', ')}`,
				...validationOptions,
			},
			validator: {
				validate(_, args: ValidationArguments) {
					const fieldToCompare = args.constraints[0];
					const presentFields = fieldToCompare.filter(
						(field: string) =>
							args.object[field] !== null &&
							args.object[field] !== undefined &&
							args.object[field] !== '',
					);
					return presentFields.length === 1;
				},
			},
		});
	};
}
