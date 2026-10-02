export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[3-9][0-9]{8}$/;
export const OTP_CODE_REGEX = /^\d{6}$/;

export function isVietnamesePhone(value: string): boolean {
	return VIETNAMESE_PHONE_REGEX.test(value.trim());
}

export function normalizeVietnamesePhone(phone: string): string {
	const trimmed = phone.trim();
	if (/^\+84[3-9][0-9]{8}$/.test(trimmed)) {
		return `0${trimmed.slice(3)}`;
	}
	return trimmed;
}
