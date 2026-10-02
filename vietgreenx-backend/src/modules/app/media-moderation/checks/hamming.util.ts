const MASK64 = 0xffffffffffffffffn;

export function hammingBigInt(a: bigint, b: bigint): number {
	let x = (a ^ b) & MASK64;
	let count = 0;
	while (x > 0n) {
		count += Number(x & 1n);
		x >>= 1n;
	}
	return count;
}
