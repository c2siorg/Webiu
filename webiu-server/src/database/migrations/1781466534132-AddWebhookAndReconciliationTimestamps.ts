import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhookAndReconciliationTimestamps1781466534132 implements MigrationInterface {
  name = 'AddWebhookAndReconciliationTimestamps1781466534132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "lastWebhookAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "lastReconciliationAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "lastReconciliationAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "lastWebhookAt"`,
    );
  }
}
