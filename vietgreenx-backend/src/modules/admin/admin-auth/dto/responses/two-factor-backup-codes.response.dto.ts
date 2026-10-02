import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TwoFactorBackupCodesResponseDto {
	@Expose()
	backupCodes: string[];
}
