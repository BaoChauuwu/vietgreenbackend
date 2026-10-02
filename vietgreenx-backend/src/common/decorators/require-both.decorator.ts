import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from 'class-validator';

export function RequireBoth(
	sibling: string,
	validationOptions?: ValidationOptions,
) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: 'requireBoth',
			target: object.constructor,
			propertyName,
			constraints: [sibling],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					const siblingValue = (args.object as any)[args.constraints[0]];
					return (value === undefined) === (siblingValue === undefined);
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} and ${args.constraints[0]} must be provided together or not at all`;
				},
			},
		});
	};
}
