import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

/**
 * Simplify WiFi Sessions
 *
 * Changes:
 * - Add last_heartbeat for timeout tracking
 * - Remove SSID/location fields (FE handles validation)
 * - Drop user_sessions table (tokens in Redis)
 * - Add indexes for performance
 */
export class SimplifyWifiSessions1735260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting WiFi sessions simplification migration...');

    // ===== 1. ADD last_heartbeat COLUMN =====
    console.log('Adding last_heartbeat column...');

    const hasLastHeartbeat = await queryRunner.hasColumn(
      'wifi_sessions',
      'last_heartbeat',
    );
    if (!hasLastHeartbeat) {
      await queryRunner.addColumn(
        'wifi_sessions',
        new TableColumn({
          name: 'last_heartbeat',
          type: 'timestamp',
          isNullable: true,
        }),
      );
      console.log('✓ last_heartbeat column added');
    } else {
      console.log('✓ last_heartbeat column already exists');
    }

    // ===== 2. BACKFILL last_heartbeat =====
    console.log('Backfilling last_heartbeat data...');

    // For completed sessions: use end_time
    await queryRunner.query(`
      UPDATE wifi_sessions 
      SET last_heartbeat = COALESCE(end_time, start_time)
      WHERE last_heartbeat IS NULL AND status = 'completed'
    `);

    // For active sessions: use current time
    await queryRunner.query(`
      UPDATE wifi_sessions 
      SET last_heartbeat = NOW()
      WHERE last_heartbeat IS NULL AND status = 'active'
    `);

    // For cancelled sessions: use start_time
    await queryRunner.query(`
      UPDATE wifi_sessions 
      SET last_heartbeat = start_time
      WHERE last_heartbeat IS NULL AND status = 'cancelled'
    `);

    console.log('✓ Backfill completed');

    // ===== 3. ADD INDEXES =====
    console.log('Creating indexes...');

    // Index for timeout queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wifi_last_heartbeat 
      ON wifi_sessions(last_heartbeat) 
      WHERE status = 'active'
    `);

    // Composite index for user queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wifi_user_status 
      ON wifi_sessions(user_id, status)
    `);

    console.log('✓ Indexes created');

    // ===== 4. DROP UNUSED COLUMNS (if they exist) =====
    console.log('Removing unused columns...');

    const columnsToRemove = [
      'ssid',
      'mac_address',
      'location',
      'latitude',
      'longitude',
      'is_valid_network',
    ];

    for (const column of columnsToRemove) {
      const hasColumn = await queryRunner.hasColumn('wifi_sessions', column);
      if (hasColumn) {
        await queryRunner.dropColumn('wifi_sessions', column);
        console.log(`✓ Dropped column: ${column}`);
      }
    }

    // ===== 5. DROP user_sessions TABLE =====
    console.log('Dropping user_sessions table (tokens moved to Redis)...');

    const hasUserSessions = await queryRunner.hasTable('user_sessions');
    if (hasUserSessions) {
      await queryRunner.dropTable('user_sessions', true, true, true);
      console.log('✓ user_sessions table dropped');
    } else {
      console.log('✓ user_sessions table does not exist');
    }

    console.log('✅ Migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back WiFi sessions simplification...');

    // ===== 1. RECREATE user_sessions TABLE =====
    console.log('Recreating user_sessions table...');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        device_id UUID NOT NULL,
        access_token_id VARCHAR(255) NOT NULL,
        refresh_token_id VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP NOT NULL,
        last_active TIMESTAMP NOT NULL,
        logged_out_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(device_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_access_token ON user_sessions(access_token_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_id);
    `);

    console.log('✓ user_sessions table recreated');

    // ===== 2. DROP INDEXES =====
    console.log('Dropping indexes...');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_wifi_last_heartbeat`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wifi_user_status`);

    console.log('✓ Indexes dropped');

    // ===== 3. DROP last_heartbeat COLUMN =====
    console.log('Dropping last_heartbeat column...');

    const hasLastHeartbeat = await queryRunner.hasColumn(
      'wifi_sessions',
      'last_heartbeat',
    );
    if (hasLastHeartbeat) {
      await queryRunner.dropColumn('wifi_sessions', 'last_heartbeat');
      console.log('✓ last_heartbeat column dropped');
    }

    console.log('✅ Rollback completed!');
  }
}
