import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovedResourceColsFromUser1773909453564 implements MigrationInterface {
  name = 'RemovedResourceColsFromUser1773909453564';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_users_total_oxy_desc"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "spin_count"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "glove_count"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "watering_can_count"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "shield_count"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "total_oxy"`);
    await queryRunner.query(
      `ALTER TABLE "trees" DROP COLUMN "unlock_condition"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trees" ADD "unlock_condition" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "total_oxy" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "shield_count" smallint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "watering_can_count" smallint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "glove_count" smallint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "spin_count" smallint NOT NULL DEFAULT '5'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_total_oxy_desc" ON "users" ("total_oxy") `,
    );
  }
}
