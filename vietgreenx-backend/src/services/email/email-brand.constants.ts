import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const EMAIL_BRAND = {
	primary: '#00A859',
	primaryDark: '#008F4A',
	primaryDarker: '#006B3A',
	primaryDeep: '#004D2B',
	primaryLight: '#E8F8F0',
	primarySoft: '#F0FAF5',
	primaryBorder: '#B8E6CE',
	surface: '#FFFFFF',
	surfaceMuted: '#F5F8F6',
	border: '#E2EBE6',
	borderLight: '#EEF4F0',
	text: '#1C1C1C',
	heading: '#0F2419',
	textMuted: '#5C6B63',
	textLight: '#8A9A92',
	textFooter: '#9CA8A2',
	background: '#E8EDEA',
	headerGradient:
		'linear-gradient(180deg, #004D2B 0%, #006B3A 42%, #00A859 100%)',
	ctaGradient: 'linear-gradient(180deg, #00C46A 0%, #00A859 50%, #008F4A 100%)',
	ctaShadow: '0 6px 20px rgba(0,168,89,0.38)',
	cardShadow: '0 8px 32px rgba(15,36,25,0.08)',
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	logoPath: '/public/email/logo.webp',
	logoFileName: 'logo.webp',
} as const;

const EMAIL_LOGO_RELATIVE = join('public', 'email', EMAIL_BRAND.logoFileName);

export function resolveEmailLogoUrl(
	backendDomain: string,
	overrideUrl?: string,
): string {
	const custom = overrideUrl?.trim();
	if (custom) return custom;
	const base = backendDomain.replace(/\/$/, '');
	return `${base}${EMAIL_BRAND.logoPath}`;
}

export function resolveEmailLogoSrc(
	backendDomain: string,
	overrideUrl?: string,
): string {
	const custom = overrideUrl?.trim();
	if (custom) return custom;

	const logoPath = join(process.cwd(), EMAIL_LOGO_RELATIVE);
	if (existsSync(logoPath)) {
		const buffer = readFileSync(logoPath);
		return `data:image/webp;base64,${buffer.toString('base64')}`;
	}

	return resolveEmailLogoUrl(backendDomain, overrideUrl);
}
