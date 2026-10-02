export const MAX_HASHTAGS_PER_POST = 30;
export const HASHTAG_MIN_LENGTH = 2;
export const HASHTAG_MAX_LENGTH = 50;

const HASHTAG_PATTERN = /#([\p{L}\p{N}_]{2,50})/gu;

export function normalizeHashtagToken(token: string): string {
	return token.trim().toLocaleLowerCase('vi-VN');
}

export function parseHashtagsFromBody(
	body: string | null | undefined,
): string[] {
	if (!body?.trim()) {
		return [];
	}

	const seen = new Set<string>();
	const result: string[] = [];
	const pattern = new RegExp(HASHTAG_PATTERN.source, HASHTAG_PATTERN.flags);
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(body)) !== null) {
		const normalized = normalizeHashtagToken(match[1]);
		if (
			normalized.length < HASHTAG_MIN_LENGTH ||
			normalized.length > HASHTAG_MAX_LENGTH
		) {
			continue;
		}
		if (!seen.has(normalized)) {
			seen.add(normalized);
			result.push(normalized);
		}
	}

	return result;
}
