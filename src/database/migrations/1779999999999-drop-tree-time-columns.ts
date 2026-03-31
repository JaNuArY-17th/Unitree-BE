import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTreeTimeColumns1779999999999 implements MigrationInterface {
  name = 'DropTreeTimeColumns1779999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trees" DROP COLUMN "time_base"');
    await queryRunner.query('ALTER TABLE "trees" DROP COLUMN "time_rate"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "trees" ADD "time_rate" numeric NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'ALTER TABLE "trees" ADD "time_base" integer NOT NULL DEFAULT 1',
    );
  }
}
