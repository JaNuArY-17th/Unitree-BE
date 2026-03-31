import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFriendshipTable1774279578813 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "friendships"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."friendships_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."friendships_status_enum" AS ENUM('ACCEPTED', 'PENDING', 'BLOCKED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "friendships" ("user_id_1" uuid NOT NULL, "user_id_2" uuid NOT NULL, "status" "public"."friendships_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d982028080801d1873edde50b78" PRIMARY KEY ("user_id_1", "user_id_2"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_e2643bb5d2d6b3ef70a1c1cbef3" FOREIGN KEY ("user_id_1") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_113a0d8673a825691ca495f1219" FOREIGN KEY ("user_id_2") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
