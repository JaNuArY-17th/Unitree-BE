import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedCodeColumnToTreesTable1774590426992 implements MigrationInterface {
  name = 'AddedCodeColumnToTreesTable1774590426992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trees" ADD "code" character varying`);
    await queryRunner.query(
      `UPDATE "trees" SET "code" = LOWER(REPLACE("name", ' ', '_'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "trees" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trees" ADD CONSTRAINT "UQ_84df7489755862ddaf90e0b93b3" UNIQUE ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trees" DROP CONSTRAINT "UQ_84df7489755862ddaf90e0b93b3"`,
    );
    await queryRunner.query(`ALTER TABLE "trees" DROP COLUMN "code"`);
  }
}
