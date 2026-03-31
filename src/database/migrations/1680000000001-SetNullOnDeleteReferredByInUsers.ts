import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetNullOnDeleteReferredByInUsers1680000000001 implements MigrationInterface {
  name = 'SetNullOnDeleteReferredByInUsers1680000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_a78a00605c95ca6737389f6360b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a78a00605c95ca6737389f6360b" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_a78a00605c95ca6737389f6360b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a78a00605c95ca6737389f6360b" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
