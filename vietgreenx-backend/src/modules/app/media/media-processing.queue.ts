export const MEDIA_PROCESSING_QUEUE = 'media-processing';

export interface MediaProcessingJobPayload {
	mediaId: string;
	storageKey: string;
}
