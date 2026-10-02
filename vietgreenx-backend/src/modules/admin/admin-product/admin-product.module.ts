import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { AdminProductService } from './admin-product.service';
import { AdminProductController } from './admin-product.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Product])],
	controllers: [AdminProductController],
	providers: [AdminProductService, ProductRepository],
})
export class AdminProductModule {}
