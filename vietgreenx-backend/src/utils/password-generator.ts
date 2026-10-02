/**
 * Password Generator Utility
 * Generates secure passwords with different complexity levels
 */

export interface PasswordGeneratorOptions {
	length?: number;
	includeUppercase?: boolean;
	includeLowercase?: boolean;
	includeNumbers?: boolean;
	includeSymbols?: boolean;
	excludeSimilar?: boolean;
	excludeAmbiguous?: boolean;
}

export class PasswordGenerator {
	private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
	private static readonly NUMBERS = '0123456789';
	private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
	private static readonly SIMILAR_CHARS = 'il1Lo0O';
	private static readonly AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

	/**
	 * Generate a secure password with specified options
	 */
	static generate(options: PasswordGeneratorOptions = {}): string {
		const {
			length = 12,
			includeUppercase = true,
			includeLowercase = true,
			includeNumbers = true,
			includeSymbols = true,
			excludeSimilar = true,
			excludeAmbiguous = true,
		} = options;

		// Validate minimum length
		if (length < 8) {
			throw new Error('Password length must be at least 8 characters');
		}

		// Build character pool
		let charPool = '';
		if (includeUppercase) charPool += this.UPPERCASE;
		if (includeLowercase) charPool += this.LOWERCASE;
		if (includeNumbers) charPool += this.NUMBERS;
		if (includeSymbols) charPool += this.SYMBOLS;

		// Remove excluded characters
		if (excludeSimilar) {
			charPool = charPool
				.split('')
				.filter((char) => !this.SIMILAR_CHARS.includes(char))
				.join('');
		}
		if (excludeAmbiguous) {
			charPool = charPool
				.split('')
				.filter((char) => !this.AMBIGUOUS_CHARS.includes(char))
				.join('');
		}

		if (charPool.length === 0) {
			throw new Error('No characters available for password generation');
		}

		// Generate password
		let password = '';
		const charPoolArray = charPool.split('');

		// Ensure at least one character from each selected type
		const requiredChars: string[] = [];
		if (includeUppercase) {
			const uppercaseChars = this.UPPERCASE.split('').filter((char) =>
				charPool.includes(char),
			);
			requiredChars.push(
				uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
			);
		}
		if (includeLowercase) {
			const lowercaseChars = this.LOWERCASE.split('').filter((char) =>
				charPool.includes(char),
			);
			requiredChars.push(
				lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
			);
		}
		if (includeNumbers) {
			const numberChars = this.NUMBERS.split('').filter((char) =>
				charPool.includes(char),
			);
			requiredChars.push(
				numberChars[Math.floor(Math.random() * numberChars.length)],
			);
		}
		if (includeSymbols) {
			const symbolChars = this.SYMBOLS.split('').filter((char) =>
				charPool.includes(char),
			);
			requiredChars.push(
				symbolChars[Math.floor(Math.random() * symbolChars.length)],
			);
		}

		// Add required characters first
		password = requiredChars.join('');

		// Fill remaining length with random characters
		for (let i = password.length; i < length; i++) {
			password +=
				charPoolArray[Math.floor(Math.random() * charPoolArray.length)];
		}

		// Shuffle the password to avoid predictable patterns
		return this.shuffleString(password);
	}

	/**
	 * Generate a simple password (similar to '123qwe!@#')
	 */
	static generateSimple(): string {
		return this.generate({
			length: 9,
			includeUppercase: false,
			includeLowercase: true,
			includeNumbers: true,
			includeSymbols: true,
			excludeSimilar: false,
			excludeAmbiguous: false,
		});
	}

	/**
	 * Generate a strong password for production use
	 */
	static generateStrong(): string {
		return this.generate({
			length: 16,
			includeUppercase: true,
			includeLowercase: true,
			includeNumbers: true,
			includeSymbols: true,
			excludeSimilar: true,
			excludeAmbiguous: true,
		});
	}

	/**
	 * Generate a memorable password using words
	 */
	static generateMemorable(): string {
		const words = [
			'apple',
			'banana',
			'cherry',
			'dragon',
			'eagle',
			'forest',
			'garden',
			'harbor',
			'island',
			'jungle',
			'knight',
			'lemon',
			'mountain',
			'ocean',
			'planet',
			'queen',
			'river',
			'sunset',
			'tiger',
			'umbrella',
			'village',
			'window',
			'yellow',
			'zebra',
		];

		const word1 = words[Math.floor(Math.random() * words.length)];
		const word2 = words[Math.floor(Math.random() * words.length)];
		const number = Math.floor(Math.random() * 1000);
		const symbol =
			this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];

		return `${word1}${word2}${number}${symbol}`;
	}

	/**
	 * Validate password strength
	 */
	static validateStrength(password: string): {
		isValid: boolean;
		score: number;
		feedback: string[];
	} {
		const feedback: string[] = [];
		let score = 0;

		// Length check
		if (password.length < 8) {
			feedback.push('Password must be at least 8 characters long');
		} else if (password.length >= 12) {
			score += 2;
		} else {
			score += 1;
		}

		// Character variety checks
		if (/[A-Z]/.test(password)) score += 1;
		else feedback.push('Include at least one uppercase letter');

		if (/[a-z]/.test(password)) score += 1;
		else feedback.push('Include at least one lowercase letter');

		if (/[0-9]/.test(password)) score += 1;
		else feedback.push('Include at least one number');

		if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
		else feedback.push('Include at least one special character');

		// Complexity checks
		if (
			password.length >= 8 &&
			/[A-Z]/.test(password) &&
			/[a-z]/.test(password) &&
			/[0-9]/.test(password)
		) {
			score += 1;
		}

		if (
			password.length >= 12 &&
			/[A-Z]/.test(password) &&
			/[a-z]/.test(password) &&
			/[0-9]/.test(password) &&
			/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
		) {
			score += 2;
		}

		const isValid = score >= 4 && feedback.length === 0;

		return {
			isValid,
			score,
			feedback,
		};
	}

	/**
	 * Shuffle string characters
	 */
	private static shuffleString(str: string): string {
		const array = str.split('');
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array.join('');
	}
}
