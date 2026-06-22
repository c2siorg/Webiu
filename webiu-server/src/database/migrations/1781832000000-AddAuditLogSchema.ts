import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogSchema1781832000000 implements MigrationInterface {
  name = 'AddAuditLogSchema1781832000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "adminId" uuid,
        "action" character varying NOT NULL,
        "entityType" character varying NOT NULL,
        "entityId" character varying,
        "oldValue" text,
        "newValue" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_admin" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_admin"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
