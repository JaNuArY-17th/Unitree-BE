import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateWifiConfigAndUpdateWifiSession20260404130000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
