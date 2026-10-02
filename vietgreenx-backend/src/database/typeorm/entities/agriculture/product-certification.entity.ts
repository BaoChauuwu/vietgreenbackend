import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Certification } from './certification.entity';

@Entity({ name: 'product_certifications', schema: 'agriculture' })
export class ProductCertification {
	@PrimaryColumn({ name: 'product_id', type: 'uuid' })
	productId: string;

	@PrimaryColumn({ name: 'certification_id', type: 'uuid' })
	certificationId: string;

	@ManyToOne(() => Product, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product: Product;

	@ManyToOne(() => Certification, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'certification_id' })
	certification: Certification;
}
