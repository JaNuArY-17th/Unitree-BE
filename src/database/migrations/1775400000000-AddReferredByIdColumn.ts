import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferredByIdColumn1775400000000 implements MigrationInterface {
  name = 'AddReferredByIdColumn1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_f18afc9d813b651ab321b83dafa"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_f18afc9d813b651ab321b83daf"`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'invited_by_user_id'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'referred_by_id'
        )
        THEN
          ALTER TABLE "users" RENAME COLUMN "invited_by_user_id" TO "referred_by_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_id" uuid`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_referred_by_id" ON "users" ("referred_by_id")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_users_referred_by_id'
        )
        THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_users_referred_by_id"
          FOREIGN KEY ("referred_by_id") REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_referred_by_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_referred_by_id"`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'referred_by_id'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'invited_by_user_id'
        )
        THEN
          ALTER TABLE "users" RENAME COLUMN "referred_by_id" TO "invited_by_user_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f18afc9d813b651ab321b83daf" ON "users" ("invited_by_user_id")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_f18afc9d813b651ab321b83dafa'
        )
        THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_f18afc9d813b651ab321b83dafa"
          FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }
}
