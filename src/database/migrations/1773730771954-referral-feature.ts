import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralFeature1773730771954 implements MigrationInterface {
    name = 'ReferralFeature1773730771954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "referral_code" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE ("referral_code")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "invited_by_code" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invited_by_code"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_code"`);
    }

}
