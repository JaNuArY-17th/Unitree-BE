import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetPathToUserTrees1774090100000 implements MigrationInterface {
  name = 'AddAssetPathToUserTrees1774090100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_trees" ADD "asset_path" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_trees" DROP COLUMN "asset_path"`,
    );
  }
}
