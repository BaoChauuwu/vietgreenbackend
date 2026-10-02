import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurgedStatusToUserStatusEnum1780285600000
	implements MigrationInterface
{
	name = 'AddPurgedStatusToUserStatusEnum1780285600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE identity.user_status ADD VALUE 'purged'`,
		);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {}
}
