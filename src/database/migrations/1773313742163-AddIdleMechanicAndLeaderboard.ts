import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdleMechanicAndLeaderboard1773313742163 implements MigrationInterface {
    name = 'AddIdleMechanicAndLeaderboard1773313742163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "total_oxy" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_trees" ADD "damaged_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "idx_users_total_oxy_desc" ON "users" ("total_oxy") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_users_total_oxy_desc"`);
        await queryRunner.query(`ALTER TABLE "user_trees" DROP COLUMN "damaged_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "total_oxy"`);
    }

}
