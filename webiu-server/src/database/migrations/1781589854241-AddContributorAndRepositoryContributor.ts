import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContributorAndRepositoryContributor1781589854241 implements MigrationInterface {
  name = 'AddContributorAndRepositoryContributor1781589854241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contributors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "githubUserId" bigint NOT NULL, "username" character varying NOT NULL, "avatarUrl" character varying NOT NULL, "profileUrl" character varying NOT NULL, "displayName" character varying, "bio" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5507d0816b412d0037ac193e0eb" UNIQUE ("githubUserId"), CONSTRAINT "PK_c94ff4e6bca235dc30625c92c90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5507d0816b412d0037ac193e0e" ON "contributors" ("githubUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca0b9ea421ac2e6c5188879d5e" ON "contributors" ("username") `,
    );
    await queryRunner.query(
      `CREATE TABLE "repository_contributors" ("repositoryId" uuid NOT NULL, "contributorId" uuid NOT NULL, "contributionCount" integer NOT NULL DEFAULT '0', "lastContributedAt" TIMESTAMP, CONSTRAINT "PK_4c819561b9c2fbbadafe865fc0b" PRIMARY KEY ("repositoryId", "contributorId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "repository_contributors" ADD CONSTRAINT "FK_d2df4a3222c383e0fee54f9fe70" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "repository_contributors" ADD CONSTRAINT "FK_53eeb804544c6e9089e570d9343" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repository_contributors" DROP CONSTRAINT "FK_53eeb804544c6e9089e570d9343"`,
    );
    await queryRunner.query(
      `ALTER TABLE "repository_contributors" DROP CONSTRAINT "FK_d2df4a3222c383e0fee54f9fe70"`,
    );
    await queryRunner.query(`DROP TABLE "repository_contributors"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca0b9ea421ac2e6c5188879d5e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5507d0816b412d0037ac193e0e"`,
    );
    await queryRunner.query(`DROP TABLE "contributors"`);
  }
}
