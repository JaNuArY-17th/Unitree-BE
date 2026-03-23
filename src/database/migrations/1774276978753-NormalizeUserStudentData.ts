import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserStudentData1774276978753 implements MigrationInterface {
  name = 'NormalizeUserStudentData1774276978753';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add temporary UUID column
    await queryRunner.query(`ALTER TABLE "users" ADD "student_id_uuid" uuid`);

    // 2. Data Migration: Map string student_id to its UUID equivalent from students table
    // We join on the student_id string column which exists in both tables currently
    await queryRunner.query(`
            UPDATE "users" 
            SET "student_id_uuid" = s.id 
            FROM "students" s 
            WHERE "users"."student_id" = s."student_id"
        `);

    // 3. Drop old columns and indices
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    ); // email unique
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullname"`);

    // 4. Drop old student_id (string) column and its FK/UQ
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_4bcc4fd204f448ad671c0747ab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_4bcc4fd204f448ad671c0747ab4"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "student_id"`);

    // 5. Rename temporary column to student_id and make it unique/FK
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "student_id_uuid" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_4bcc4fd204f448ad671c0747ab4" UNIQUE ("student_id")`,
    );

    // 6. Add indices and constraints as originally planned
    await queryRunner.query(
      `CREATE INDEX "IDX_78ea46ef6e52037c2c3e173f92" ON "students" ("full_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_4bcc4fd204f448ad671c0747ab4" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_4bcc4fd204f448ad671c0747ab4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78ea46ef6e52037c2c3e173f92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_4bcc4fd204f448ad671c0747ab4"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "student_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "student_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_4bcc4fd204f448ad671c0747ab4" UNIQUE ("student_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_4bcc4fd204f448ad671c0747ab4" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fullname" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
  }
}
