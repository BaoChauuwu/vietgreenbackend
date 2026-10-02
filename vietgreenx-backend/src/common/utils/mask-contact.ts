import { normalizeVietnamesePhone } from './normalize-vietnamese-phone';

export function maskEmail(email: string): string {
	const atIndex = email.indexOf('@');
	if (atIndex <= 0) {
		return '***@***';
	}

	const local = email.slice(0, atIndex);
	const domain = email.slice(atIndex + 1);
	const visibleLength = Math.min(3, local.length);
	const visible = local.slice(0, visibleLength);

	return `${visible}***@${domain}`;
}

export function maskVietnamesePhone(phone: string): string {
	const normalized = normalizeVietnamesePhone(phone);
	if (normalized.length < 7) {
		return '***';
	}

	const headLength = Math.min(4, normalized.length - 3);
	const tailLength = 3;

	return `${normalized.slice(0, headLength)}***${normalized.slice(-tailLength)}`;
}
