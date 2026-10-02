import sharp from 'sharp';

export async function dhash(buf: Buffer): Promise<bigint> {
	const w = 9,
		h = 8;
	const px = await sharp(buf)
		.grayscale()
		.resize(w, h, { fit: 'fill' })
		.raw()
		.toBuffer();
	let bits = 0n;
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w - 1; x++) {
			const i = y * w + x;
			bits = (bits << 1n) | (px[i] > px[i + 1] ? 1n : 0n);
		}
	return bits;
}

export async function phash(buf: Buffer): Promise<bigint> {
	const N = 32;
	const px = await sharp(buf)
		.grayscale()
		.resize(N, N, { fit: 'fill' })
		.raw()
		.toBuffer();
	const f = new Float64Array(N * N);
	for (let i = 0; i < N * N; i++) f[i] = px[i];
	const d = dct2d(f, N);
	const low: number[] = [];
	for (let y = 0; y < 8; y++)
		for (let x = 0; x < 8; x++) low.push(d[y * N + x]);
	const med = median(low);
	let bits = 0n;
	for (const v of low) bits = (bits << 1n) | (v > med ? 1n : 0n);
	return bits;
}

function dct2d(f: Float64Array, N: number): Float64Array {
	const c = (k: number) => (k === 0 ? Math.SQRT1_2 : 1);
	const tmp = new Float64Array(N * N);
	for (let y = 0; y < N; y++)
		for (let u = 0; u < N; u++) {
			let s = 0;
			for (let x = 0; x < N; x++)
				s += f[y * N + x] * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
			tmp[y * N + u] = c(u) * Math.sqrt(2 / N) * s;
		}
	const out = new Float64Array(N * N);
	for (let u = 0; u < N; u++)
		for (let v = 0; v < N; v++) {
			let s = 0;
			for (let y = 0; y < N; y++)
				s += tmp[y * N + u] * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
			out[v * N + u] = c(v) * Math.sqrt(2 / N) * s;
		}
	return out;
}

function median(a: number[]): number {
	const s = [...a].sort((x, y) => x - y);
	return s[Math.floor(s.length / 2)];
}
