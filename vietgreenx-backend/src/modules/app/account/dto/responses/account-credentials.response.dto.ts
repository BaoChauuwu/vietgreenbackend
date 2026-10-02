import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SignupChannel } from '@app/common/enums/signup-channel.enum';
import { CredentialChannelResponseDto } from './credential-channel.response.dto';

export class AccountCredentialsResponseDto {
	@ApiProperty({ type: () => CredentialChannelResponseDto })
	@Expose()
	@Type(() => CredentialChannelResponseDto)
	email: CredentialChannelResponseDto;

	@ApiProperty({ type: () => CredentialChannelResponseDto })
	@Expose()
	@Type(() => CredentialChannelResponseDto)
	phone: CredentialChannelResponseDto;

	@ApiPropertyOptional({
		enum: SignupChannel,
		description:
			'Original signup channel; set at registration and never changed',
	})
	@Expose()
	registeredWith?: SignupChannel | null;
}
