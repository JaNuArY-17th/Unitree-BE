import { MigrationInterface, QueryRunner } from "typeorm";

export class Added3ColsToResources1773911248739 implements MigrationInterface {
    name = 'Added3ColsToResources1773911248739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trees" ADD "unlock_condition" text`);
        await queryRunner.query(`ALTER TABLE "resources" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "resources" ADD CONSTRAINT "UQ_b7ab912cd81e4b447e43d45e382" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "resources" ADD "assets_path" character varying`);
        await queryRunner.query(`ALTER TABLE "resources" ADD "max_stack" integer`);
        await queryRunner.query(`ALTER TABLE "resources" DROP CONSTRAINT "UQ_f276c867b5752b7cc2c6c797b2b"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resources" ADD CONSTRAINT "UQ_f276c867b5752b7cc2c6c797b2b" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "resources" DROP COLUMN "max_stack"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP COLUMN "assets_path"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP CONSTRAINT "UQ_b7ab912cd81e4b447e43d45e382"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "trees" DROP COLUMN "unlock_condition"`);
    }

}
