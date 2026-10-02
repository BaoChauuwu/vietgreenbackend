import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SavedSupplierRepository } from '@app/database/typeorm/repositories/saved-supplier.repository';
import { SupplierReviewRepository } from '@app/database/typeorm/repositories/supplier-review.repository';
import { OrderRepository } from '@app/database/typeorm/repositories/order.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { SavedSupplier } from '@app/database/typeorm/entities/agriculture/saved-supplier.entity';
import { SupplierReview } from '@app/database/typeorm/entities/agriculture/supplier-review.entity';
import { Order } from '@app/database/typeorm/entities/agriculture/order.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			SavedSupplier,
			SupplierReview,
			Order,
			User,
			Media,
		]),
		AppAuthModule,
	],
	controllers: [SupplierController],
	providers: [
		SupplierService,
		SavedSupplierRepository,
		SupplierReviewRepository,
		OrderRepository,
		UserRepository,
		MediaRepository,
	],
})
export class SupplierModule {}
