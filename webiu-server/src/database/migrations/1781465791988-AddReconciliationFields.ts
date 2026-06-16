import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReconciliationFields1781465791988 implements MigrationInterface {
  name = 'AddReconciliationFields1781465791988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "syncStatus" character varying NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "repositories" ADD "syncError" text`);
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "reconciliationSource" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "reconciliationSource"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "syncError"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "syncStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "isActive"`,
    );
  }
}
