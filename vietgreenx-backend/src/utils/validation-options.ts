import { ValidationPipeOptions } from '@nestjs/common';

const validationOptions: ValidationPipeOptions = {
	transform: true,
	whitelist: true,
};

export default validationOptions;
