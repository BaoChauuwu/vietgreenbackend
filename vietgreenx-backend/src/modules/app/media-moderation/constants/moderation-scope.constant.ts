// storageKey format: {folder}/{userId}/{uuid}.{ext}
export const MODERATION_SCOPE_PREFIXES = [
	'products',
	'trade-posts',
	'production-logs',
	'green-profiles',
	'posts',
];

export function purposeFromStorageKey(storageKey: string): string | null {
	const prefix = storageKey.split('/')[0];
	return MODERATION_SCOPE_PREFIXES.includes(prefix) ? prefix : null;
}
