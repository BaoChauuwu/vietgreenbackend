import { Media } from '@app/database/typeorm/entities/media/media.entity';

export class MediaCompletedEvent {
	constructor(public readonly media: Media) {}
}
