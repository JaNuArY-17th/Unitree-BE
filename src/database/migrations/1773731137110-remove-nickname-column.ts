import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNicknameColumn1773731137110 implements MigrationInterface {
  name = 'RemoveNicknameColumn1773731137110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nickname"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "nickname" character varying NOT NULL`,
    );
  }
}
