"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWifiConfigAndUpdateWifiSession20260404130000 = void 0;
const typeorm_1 = require("typeorm");
class CreateWifiConfigAndUpdateWifiSession20260404130000 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'wifi_config',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'ssid',
                    type: 'varchar',
                    isUnique: true,
                },
                {
                    name: 'public_ip_address',
                    type: 'varchar',
                },
                {
                    name: 'reward_rate',
                    type: 'int',
                    default: 5,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['active', 'disabled'],
                    default: `'active'`,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'deleted_at',
                    type: 'timestamp',
                    isNullable: true,
                },
            ],
        }), true);
        await queryRunner.addColumn('wifi_sessions', new typeorm_1.TableColumn({
            name: 'wifi_config_id',
            type: 'uuid',
            isNullable: true,
        }));
        await queryRunner.addColumn('wifi_sessions', new typeorm_1.TableColumn({
            name: 'start_ip',
            type: 'varchar',
            isNullable: true,
        }));
        await queryRunner.addColumn('wifi_sessions', new typeorm_1.TableColumn({
            name: 'cheat_flag',
            type: 'boolean',
            default: false,
        }));
        await queryRunner.addColumn('wifi_sessions', new typeorm_1.TableColumn({
            name: 'cheat_reason',
            type: 'varchar',
            isNullable: true,
        }));
        await queryRunner.createForeignKey('wifi_sessions', new typeorm_1.TableForeignKey({
            columnNames: ['wifi_config_id'],
            referencedTableName: 'wifi_config',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));
        await queryRunner.query(`ALTER TYPE "wifi_session_status" ADD VALUE IF NOT EXISTS 'timeout'`);
        await queryRunner.query(`ALTER TYPE "wifi_session_status" ADD VALUE IF NOT EXISTS 'cheat_flagged'`);
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('wifi_sessions');
        const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('wifi_config_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('wifi_sessions', foreignKey);
        }
        await queryRunner.dropColumn('wifi_sessions', 'wifi_config_id');
        await queryRunner.dropColumn('wifi_sessions', 'start_ip');
        await queryRunner.dropColumn('wifi_sessions', 'cheat_flag');
        await queryRunner.dropColumn('wifi_sessions', 'cheat_reason');
        await queryRunner.dropTable('wifi_config');
    }
}
exports.CreateWifiConfigAndUpdateWifiSession20260404130000 = CreateWifiConfigAndUpdateWifiSession20260404130000;
//# sourceMappingURL=20260404130000-CreateWifiConfigAndUpdateWifiSession.js.map