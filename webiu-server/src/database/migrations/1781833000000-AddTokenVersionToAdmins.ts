import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionToAdmins1781833000000 implements MigrationInterface {
  name = 'AddTokenVersionToAdmins1781833000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" ADD "tokenVersion" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "tokenVersion"`);
  }
}
