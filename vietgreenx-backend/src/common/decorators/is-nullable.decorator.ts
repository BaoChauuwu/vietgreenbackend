import { ValidateIf } from 'class-validator';

/**
 * Allows null as a valid value. Place before type validators (e.g. @IsString()).
 * Combined with @IsOptional():
 *   - undefined → @IsOptional skips all validators (keep existing)
 *   - null      → @IsNullable skips type validators (clear field)
 *   - value     → all validators run normally
 */
export const IsNullable = () => ValidateIf((_, value) => value !== null);
