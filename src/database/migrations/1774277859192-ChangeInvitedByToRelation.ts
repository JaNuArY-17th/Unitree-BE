import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeInvitedByToRelation1774277859192 implements MigrationInterface {
  name = 'ChangeInvitedByToRelation1774277859192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the new UUID column
    await queryRunner.query(
      `ALTER TABLE "users" ADD "invited_by_user_id" uuid`,
    );

    // 2. Data Migration: map the string invited_by_code to the inviter's UUID
    await queryRunner.query(`
        UPDATE "users" u
        SET "invited_by_user_id" = inviter."id"
        FROM "users" inviter
        WHERE u."invited_by_code" = inviter."referral_code"
    `);

    // 3. Drop the old string column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "invited_by_code"`,
    );

    // 4. Add index and FK constraint
    await queryRunner.query(
      `CREATE INDEX "IDX_f18afc9d813b651ab321b83daf" ON "users" ("invited_by_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f18afc9d813b651ab321b83dafa" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f18afc9d813b651ab321b83dafa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f18afc9d813b651ab321b83daf"`,
    );

    // 1. Recreate the old string column
    await queryRunner.query(
      `ALTER TABLE "users" ADD "invited_by_code" character varying`,
    );

    // 2. Data Migration: map the UUID back to the string invited_by_code
    await queryRunner.query(`
        UPDATE "users" u
        SET "invited_by_code" = inviter."referral_code"
        FROM "users" inviter
        WHERE u."invited_by_user_id" = inviter."id"
    `);

    // 3. Drop the new UUID column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "invited_by_user_id"`,
    );
  }
}
