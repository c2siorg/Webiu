import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGsocSchema1781722720191 implements MigrationInterface {
  name = 'AddGsocSchema1781722720191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "gsoc_mentors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "githubHandle" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dbdcb628501e25c69edf276babb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gsoc_ideas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "programId" uuid NOT NULL, "projectNumber" integer NOT NULL, "title" character varying NOT NULL, "explanation" text NOT NULL, "expectedResults" text, "prerequisites" text, "difficulty" character varying NOT NULL, "durationHours" integer NOT NULL DEFAULT '350', "slackChannel" character varying, "githubUrl" character varying, "status" character varying NOT NULL DEFAULT 'DRAFT', "displayOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d8492c73711fc026861389bbc7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gsoc_programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "year" integer NOT NULL, "title" character varying NOT NULL, "description" text, "heroImageUrl" character varying, "introHtml" text, "slackUrl" character varying, "proposalTemplateUrl" character varying, "githubOrgUrl" character varying, "status" character varying NOT NULL DEFAULT 'DRAFT', "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b77d8bc9381afbc911d49f68224" UNIQUE ("year"), CONSTRAINT "PK_49c3166d910772dab0b1a8b8450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gsoc_idea_mentors" ("ideaId" uuid NOT NULL, "mentorId" uuid NOT NULL, CONSTRAINT "PK_6e4973484488689bb34d76f40ce" PRIMARY KEY ("ideaId", "mentorId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d96a579290cb2df5439402264" ON "gsoc_idea_mentors" ("ideaId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6dfd1c86bb5639ffbcccf8727c" ON "gsoc_idea_mentors" ("mentorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "gsoc_ideas" ADD CONSTRAINT "FK_fb0145310af8daacc8959aade40" FOREIGN KEY ("programId") REFERENCES "gsoc_programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gsoc_idea_mentors" ADD CONSTRAINT "FK_3d96a579290cb2df5439402264e" FOREIGN KEY ("ideaId") REFERENCES "gsoc_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "gsoc_idea_mentors" ADD CONSTRAINT "FK_6dfd1c86bb5639ffbcccf8727c3" FOREIGN KEY ("mentorId") REFERENCES "gsoc_mentors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gsoc_idea_mentors" DROP CONSTRAINT "FK_6dfd1c86bb5639ffbcccf8727c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gsoc_idea_mentors" DROP CONSTRAINT "FK_3d96a579290cb2df5439402264e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gsoc_ideas" DROP CONSTRAINT "FK_fb0145310af8daacc8959aade40"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6dfd1c86bb5639ffbcccf8727c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d96a579290cb2df5439402264"`,
    );
    await queryRunner.query(`DROP TABLE "gsoc_idea_mentors"`);
    await queryRunner.query(`DROP TABLE "gsoc_programs"`);
    await queryRunner.query(`DROP TABLE "gsoc_ideas"`);
    await queryRunner.query(`DROP TABLE "gsoc_mentors"`);
  }
}
