// Quick test script for database functionality
import initSqlJs from 'sql.js';
import { writeFileSync, existsSync } from 'fs';

console.log('🧪 Testing sql.js setup...\n');

async function test() {
  try {
    // Initialize SQL.js
    console.log('1. Initializing SQL.js...');
    const SQL = await initSqlJs();
    console.log('   ✅ SQL.js loaded');
    
    // Create database
    console.log('\n2. Creating in-memory database...');
    const db = new SQL.Database();
    console.log('   ✅ Database created');
    
    // Create table
    console.log('\n3. Creating test table...');
    db.run(`
      CREATE TABLE test (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
    console.log('   ✅ Table created');
    
    // Insert data
    console.log('\n4. Inserting test data...');
    db.run('INSERT INTO test (name) VALUES (?)', ['Test 1']);
    db.run('INSERT INTO test (name) VALUES (?)', ['Test 2']);
    console.log('   ✅ Data inserted');
    
    // Query data
    console.log('\n5. Querying data...');
    const stmt = db.prepare('SELECT * FROM test');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    console.log('   ✅ Query successful');
    console.log('   Results:', results);
    
    // Save to file
    console.log('\n6. Saving to file...');
    const data = db.export();
    const buffer = Buffer.from(data);
    const testPath = './test.db';
    writeFileSync(testPath, buffer);
    console.log(`   ✅ Saved to ${testPath}`);
    console.log(`   File exists: ${existsSync(testPath)}`);
    
    // Close
    db.close();
    console.log('\n7. Database closed');
    
    console.log('\n✅ All tests passed!');
    console.log('\n📦 Your setup is working correctly.');
    console.log('👉 You can now run: npm run db:migrate');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
