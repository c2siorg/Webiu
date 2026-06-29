import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepositoryVisibilityAndLanguage1781834000000 implements MigrationInterface {
  name = 'AddRepositoryVisibilityAndLanguage1781834000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "visibility" character varying NOT NULL DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "isArchived" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" ADD "language" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "language"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "isArchived"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repositories" DROP COLUMN "visibility"`,
    );
  }
}
