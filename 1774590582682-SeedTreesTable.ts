import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTreesTable1774590582682 implements MigrationInterface {
    name = 'SeedTreesTable1774590582682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trees" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trees" ADD CONSTRAINT "UQ_84df7489755862ddaf90e0b93b3" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trees" DROP CONSTRAINT "UQ_84df7489755862ddaf90e0b93b3"`);
        await queryRunner.query(`ALTER TABLE "trees" DROP COLUMN "code"`);
    }

}
