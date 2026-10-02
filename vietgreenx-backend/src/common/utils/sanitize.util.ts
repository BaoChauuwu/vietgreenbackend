export function sanitizeData(data: any): any {
	if (!data || typeof data !== 'object') {
		return data;
	}
	if (Array.isArray(data)) {
		return data.map((item) => sanitizeData(item));
	}
	const sensitiveKeys = [
		'password',
		'passwordConfirm',
		'oldPassword',
		'newPassword',
		'passwordHash',
		'token',
		'accessToken',
		'refreshToken',
		'secret',
		'otp',
	];
	const sanitized = { ...data };
	for (const key of Object.keys(sanitized)) {
		if (
			sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))
		) {
			sanitized[key] = '***';
		} else if (typeof sanitized[key] === 'object') {
			sanitized[key] = sanitizeData(sanitized[key]);
		}
	}
	return sanitized;
}
