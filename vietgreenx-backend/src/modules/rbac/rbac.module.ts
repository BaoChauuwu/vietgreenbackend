import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	RbacPermission,
	RbacRole,
	RbacRolePermission,
} from '@app/database/typeorm/entities';
import { PermissionsGuard } from '@app/common/guards/permissions/permissions.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([RbacPermission, RbacRole, RbacRolePermission]),
	],
	providers: [RbacService, PermissionsGuard],
	exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
