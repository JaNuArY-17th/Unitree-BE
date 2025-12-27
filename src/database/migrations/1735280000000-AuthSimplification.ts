import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Auth Simplification Migration
 *
 * Changes:
 * 1. Drop user_sessions table (sessions now in Redis)
 * 2. Drop otps table (OTPs now in Redis)
 * 3. Clean User entity (remove token fields)
 * 4. Create tree_types table
 * 5. Migrate trees to use tree_type_id
 */
export class AuthSimplification1735280000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Starting Auth Simplification Migration...');

    // ===== PART 1: DROP USER_SESSIONS TABLE =====
    console.log(
      '\n🔐 Part 1: Dropping user_sessions table (moving to Redis)...',
    );

    const hasUserSessionsTable = await queryRunner.hasTable('user_sessions');
    if (hasUserSessionsTable) {
      await queryRunner.dropTable('user_sessions', true, true, true);
      console.log('✅ user_sessions table dropped');
    } else {
      console.log('ℹ️  user_sessions table does not exist, skipping');
    }

    // ===== PART 2: DROP OTPs TABLE =====
    console.log('\n📧 Part 2: Dropping otps table (moving to Redis)...');

    const hasOtpsTable = await queryRunner.hasTable('otps');
    if (hasOtpsTable) {
      await queryRunner.dropTable('otps', true, true, true);
      console.log('✅ otps table dropped');
    } else {
      console.log('ℹ️  otps table does not exist, skipping');
    }

    // ===== PART 2: CLEAN USER ENTITY =====
    console.log('\n👤 Part 2: Cleaning User entity (removing token fields)...');

    const columnsToRemove = [
      'verification_token',
      'reset_password_token',
      'reset_password_expires',
      'fcm_token',
    ];

    for (const column of columnsToRemove) {
      const hasColumn = await queryRunner.hasColumn('users', column);
      if (hasColumn) {
        await queryRunner.dropColumn('users', column);
        console.log(`✅ Dropped column: users.${column}`);
      } else {
        console.log(`ℹ️  Column users.${column} does not exist, skipping`);
      }
    }

    // ===== PART 3: CREATE TREE_TYPES TABLE =====
    console.log('\n🌳 Part 3: Creating tree_types table...');

    await queryRunner.query(`
      CREATE TABLE tree_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(500),
        growth_stages INTEGER DEFAULT 5 NOT NULL,
        points_per_stage INTEGER DEFAULT 100 NOT NULL,
        water_frequency_hours INTEGER DEFAULT 24 NOT NULL,
        co2_offset_kg DECIMAL(10,2) DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        sort_order INTEGER DEFAULT 0 NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    await queryRunner.createIndex(
      'tree_types',
      new TableIndex({
        name: 'idx_tree_types_code',
        columnNames: ['code'],
      }),
    );

    await queryRunner.createIndex(
      'tree_types',
      new TableIndex({
        name: 'idx_tree_types_active',
        columnNames: ['is_active'],
      }),
    );

    console.log('✅ tree_types table created with indexes');

    // ===== PART 4: SEED TREE TYPES =====
    console.log('\n🌱 Part 4: Seeding default tree types...');

    await queryRunner.query(`
      INSERT INTO tree_types (code, name, description, growth_stages, points_per_stage, water_frequency_hours, co2_offset_kg, sort_order, metadata)
      VALUES
        (
          'oak',
          'Oak Tree',
          'Strong and long-lasting oak tree that can live for hundreds of years',
          5,
          100,
          24,
          21.77,
          1,
          '{"rarity": "common", "seasonalBonus": false}'::jsonb
        ),
        (
          'pine',
          'Pine Tree',
          'Fast-growing evergreen pine tree, perfect for beginners',
          4,
          80,
          24,
          10.0,
          2,
          '{"rarity": "common", "seasonalBonus": false}'::jsonb
        ),
        (
          'maple',
          'Maple Tree',
          'Beautiful maple tree with colorful leaves in autumn',
          5,
          120,
          20,
          25.0,
          3,
          '{"rarity": "rare", "seasonalBonus": true}'::jsonb
        ),
        (
          'cherry',
          'Cherry Blossom',
          'Stunning cherry blossom tree with pink flowers in spring',
          6,
          150,
          18,
          15.0,
          4,
          '{"rarity": "rare", "seasonalBonus": true}'::jsonb
        ),
        (
          'bamboo',
          'Bamboo',
          'Rapid-growing bamboo plant, reaches maturity quickly',
          3,
          60,
          12,
          8.0,
          5,
          '{"rarity": "common", "seasonalBonus": false}'::jsonb
        ),
        (
          'redwood',
          'Redwood',
          'Majestic giant redwood, the tallest tree in the world',
          7,
          200,
          36,
          50.0,
          6,
          '{"rarity": "epic", "seasonalBonus": false, "unlockLevel": 10}'::jsonb
        ),
        (
          'sakura',
          'Japanese Sakura',
          'Legendary Japanese cherry blossom with special abilities',
          8,
          250,
          24,
          30.0,
          7,
          '{"rarity": "legendary", "seasonalBonus": true, "specialAbility": "Double points during spring", "unlockPoints": 1000}'::jsonb
        );
    `);

    console.log(
      '✅ Seeded 7 tree types (oak, pine, maple, cherry, bamboo, redwood, sakura)',
    );

    // ===== PART 5: MIGRATE TREES TABLE =====
    console.log('\n🌲 Part 5: Migrating trees table...');

    // Add tree_type_id column
    await queryRunner.addColumn(
      'trees',
      new TableColumn({
        name: 'tree_type_id',
        type: 'uuid',
        isNullable: true, // Temporarily nullable
      }),
    );
    console.log('✅ Added tree_type_id column to trees');

    // Migrate existing data (map tree_type string to tree_type_id)
    await queryRunner.query(`
      UPDATE trees t
      SET tree_type_id = tt.id
      FROM tree_types tt
      WHERE LOWER(TRIM(t.tree_type)) = tt.code;
    `);
    console.log(
      '✅ Migrated existing tree data (mapped tree_type to tree_type_id)',
    );

    // Set default for unmapped trees (use oak as default)
    await queryRunner.query(`
      UPDATE trees t
      SET tree_type_id = (SELECT id FROM tree_types WHERE code = 'oak' LIMIT 1)
      WHERE tree_type_id IS NULL;
    `);
    console.log('✅ Set default tree type (oak) for unmapped trees');

    // Make tree_type_id NOT NULL
    await queryRunner.changeColumn(
      'trees',
      'tree_type_id',
      new TableColumn({
        name: 'tree_type_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'trees',
      new TableForeignKey({
        name: 'fk_trees_tree_type',
        columnNames: ['tree_type_id'],
        referencedTableName: 'tree_types',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Add index
    await queryRunner.createIndex(
      'trees',
      new TableIndex({
        name: 'idx_trees_tree_type',
        columnNames: ['tree_type_id'],
      }),
    );
    console.log('✅ Added foreign key and index');

    // Drop old tree_type column
    const hasTreeTypeColumn = await queryRunner.hasColumn('trees', 'tree_type');
    if (hasTreeTypeColumn) {
      await queryRunner.dropColumn('trees', 'tree_type');
      console.log('✅ Dropped old tree_type column');
    }

    console.log('\n✅ Auth Simplification Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ User sessions moved to Redis');
    console.log('  ✅ OTPs moved to Redis');
    console.log('  ✅ User entity cleaned (4 columns removed)');
    console.log('  ✅ tree_types table created (7 types seeded)');
    console.log('  ✅ trees table migrated to use tree_type_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏮️  Rolling back Auth Simplification Migration...');

    // Reverse Part 5: Restore trees table
    console.log('\n🌲 Restoring trees table...');

    await queryRunner.dropIndex('trees', 'idx_trees_tree_type');
    await queryRunner.dropForeignKey('trees', 'fk_trees_tree_type');

    // Add back tree_type column
    await queryRunner.addColumn(
      'trees',
      new TableColumn({
        name: 'tree_type',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Migrate data back
    await queryRunner.query(`
      UPDATE trees t
      SET tree_type = tt.code
      FROM tree_types tt
      WHERE t.tree_type_id = tt.id;
    `);

    await queryRunner.dropColumn('trees', 'tree_type_id');

    // Reverse Part 4 & 3: Drop tree_types
    console.log('\n🌳 Dropping tree_types table...');
    await queryRunner.dropTable('tree_types', true, true, true);

    // Reverse Part 2: Restore User columns
    console.log('\n👤 Restoring User entity columns...');

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'verification_token',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_password_token',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_password_expires',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'fcm_token',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Reverse Part 1: Recreate user_sessions table
    console.log('\n🔐 Recreating user_sessions table...');
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        device_id UUID NOT NULL,
        access_token_id VARCHAR(255) NOT NULL,
        refresh_token_id VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
      
      CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX idx_user_sessions_device ON user_sessions(device_id);
      CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
    `);
    console.log('✅ user_sessions table recreated');

    // Reverse Part 1: Recreate otps table
    console.log('\n📧 Recreating otps table...');
    await queryRunner.query(`
      CREATE TABLE otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        otp_code VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        device_id UUID,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        is_used BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
      
      CREATE INDEX idx_otps_user ON otps(user_id);
      CREATE INDEX idx_otps_expires ON otps(expires_at);
      CREATE INDEX idx_otps_device ON otps(device_id);
    `);

    console.log('✅ Rollback completed');
  }
}
