import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepositoryEntity1781293359294 implements MigrationInterface {
  name = 'AddRepositoryEntity1781293359294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "repositories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "githubRepoId" bigint NOT NULL, "name" character varying NOT NULL, "description" text, "homepage" character varying, "topics" text, "stars" integer NOT NULL DEFAULT '0', "forks" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastSyncedAt" TIMESTAMP, CONSTRAINT "UQ_a477894a09b73af227d83951875" UNIQUE ("githubRepoId"), CONSTRAINT "UQ_98b624f19034b52b7d4a646b0c3" UNIQUE ("name"), CONSTRAINT "PK_ef0c358c04b4f4d29b8ca68ddff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a477894a09b73af227d8395187" ON "repositories" ("githubRepoId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_98b624f19034b52b7d4a646b0c" ON "repositories" ("name") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98b624f19034b52b7d4a646b0c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a477894a09b73af227d8395187"`,
    );
    await queryRunner.query(`DROP TABLE "repositories"`);
  }
}
