import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTreesTable1774590582682 implements MigrationInterface {
  name = 'SeedTreesTable1774590582682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'trees' AND column_name = 'code'
                ) THEN
                    ALTER TABLE "trees" ADD "code" character varying;
                    UPDATE "trees" SET "code" = LOWER(REPLACE("name", ' ', '_'));
                    ALTER TABLE "trees" ALTER COLUMN "code" SET NOT NULL;
                END IF;
            END $$;
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'UQ_84df7489755862ddaf90e0b93b3'
                ) THEN
                    ALTER TABLE "trees" ADD CONSTRAINT "UQ_84df7489755862ddaf90e0b93b3" UNIQUE ("code");
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trees" DROP CONSTRAINT IF EXISTS "UQ_84df7489755862ddaf90e0b93b3"`,
    );
    await queryRunner.query(`ALTER TABLE "trees" DROP COLUMN IF EXISTS "code"`);
  }
}
