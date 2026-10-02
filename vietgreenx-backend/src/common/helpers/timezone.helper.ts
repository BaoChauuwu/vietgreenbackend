import momentTimezone from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@app/config/config-key.enum';

export function getTimezone(configService: ConfigService, headers: any) {
	let timezone = configService.get(ConfigKeys.TIMEZONE);
	if (headers.timezone && momentTimezone.tz.zone(headers.timezone) != null) {
		timezone = headers.timezone;
	}

	return timezone;
}
