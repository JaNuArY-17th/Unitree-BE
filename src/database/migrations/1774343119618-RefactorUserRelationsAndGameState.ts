import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorUserRelationsAndGameState1774343119618 implements MigrationInterface {
    name = 'RefactorUserRelationsAndGameState1774343119618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_game_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "last_spin_regen" TIMESTAMP, CONSTRAINT "UQ_ad71920d1be5990200121d0fbac" UNIQUE ("user_id"), CONSTRAINT "REL_ad71920d1be5990200121d0fba" UNIQUE ("user_id"), CONSTRAINT "PK_2daa6132b66a0ed2ed5d8497365" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_spin_regen"`);
        await queryRunner.query(`ALTER TABLE "user_game_states" ADD CONSTRAINT "FK_ad71920d1be5990200121d0fbac" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_game_states" DROP CONSTRAINT "FK_ad71920d1be5990200121d0fbac"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_spin_regen" TIMESTAMP`);
        await queryRunner.query(`DROP TABLE "user_game_states"`);
    }

}
