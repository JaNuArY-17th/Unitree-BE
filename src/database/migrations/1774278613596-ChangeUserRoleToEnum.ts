import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUserRoleToEnum1774278613596 implements MigrationInterface {
  name = 'ChangeUserRoleToEnum1774278613596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'super_admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE character varying`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
