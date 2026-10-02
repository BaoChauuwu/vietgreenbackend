export const generateForgotOtpTemplate = (code: string) => {
	return {
		subject: '[VietGreenX] Password Reset Verification Code',
		html: `
			<p>Password Reset Verification Code: <strong style="font-size:24px;letter-spacing:4px;">${code}</strong></p>
			<p>The code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
		`,
	};
};

export const generateChangePasswordOtpTemplate = (code: string) => {
	return {
		subject: '[VietGreenX] Change Password Verification Code',
		html: `
			<p>Your password change verification code is: <strong style="font-size:24px;letter-spacing:4px;color:#2E7D32;">${code}</strong></p>
			<p>This code is valid for <strong>15 minutes</strong>. Absolutely do not share this code with anyone.</p>
		`,
	};
};

export const generateChangeEmailOtpTemplate = (code: string) => {
	return {
		subject: '[VietGreenX] Change Email Verification Code',
		html: `
			<p>Your email change verification code is: <strong style="font-size:24px;letter-spacing:4px;color:#2E7D32;">${code}</strong></p>
			<p>This code is valid for <strong>15 minutes</strong>. Absolutely do not share this code with anyone.</p>
		`,
	};
};
