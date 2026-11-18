#!/usr/bin/env node
/**
 * Debug script to start server with verbose logging
 */

// Enable all logs
process.env.LOG_LEVEL = 'debug';
process.env.NODE_ENV = 'development';

console.log('🔍 Starting server in debug mode...\n');

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Try to import and start
console.log('1. Loading config...');
try {
  const config = await import('./src/utils/config.js');
  console.log('   ✅ Config loaded');
  console.log('   Port:', config.config.port);
  console.log('   DB:', config.config.database.path);
} catch (error) {
  console.error('   ❌ Config failed:', error.message);
  throw error;
}

console.log('\n2. Loading database module...');
try {
  const db = await import('./src/db/database.js');
  console.log('   ✅ Database module loaded');
} catch (error) {
  console.error('   ❌ Database module failed:', error.message);
  throw error;
}

console.log('\n3. Loading server module...');
try {
  const server = await import('./src/api/server.js');
  console.log('   ✅ Server module loaded');
  
  console.log('\n4. Starting server...');
  await server.start();
  
} catch (error) {
  console.error('   ❌ Server failed:', error.message);
  console.error('\nFull stack trace:');
  console.error(error);
  process.exit(1);
}
