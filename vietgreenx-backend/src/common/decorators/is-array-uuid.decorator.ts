import { registerDecorator, ValidationOptions } from 'class-validator';

import validator from 'validator';

export function IsUuidArray(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		let fakeElements: string[] = [];
		registerDecorator({
			name: 'IsUuidArray',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				defaultMessage(): string {
					return `${propertyName} is not list uuid`;
				},
				validate(value: string[]) {
					fakeElements = [];
					let isOnlyUuid = true;
					value.forEach((element) => {
						const result = validator.isUUID(element);
						if (!result) {
							isOnlyUuid = result;
							fakeElements.push(element);
						}
					});
					return isOnlyUuid;
				},
			},
		});
	};
}
