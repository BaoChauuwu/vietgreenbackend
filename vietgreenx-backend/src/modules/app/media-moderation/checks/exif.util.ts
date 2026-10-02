import sharp from 'sharp';

export async function exifSuspicious(buf: Buffer): Promise<boolean> {
	try {
		const meta = await sharp(buf).metadata();
		return !meta.exif;
	} catch {
		return true;
	}
}
