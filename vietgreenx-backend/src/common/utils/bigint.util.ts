export function toSigned64(v: bigint): bigint {
	return v >= 1n << 63n ? v - (1n << 64n) : v;
}

export function toUnsigned64(v: bigint): bigint {
	return v < 0n ? v + (1n << 64n) : v;
}
