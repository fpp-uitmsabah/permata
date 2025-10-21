// Example script to test Prisma database connection
// Run with: node test-db-connection.js

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma database connection...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // Optional: Get database version info
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database info:', result);
    
    // Count existing faculty records
    const count = await prisma.faculty.count();
    console.log(`📚 Number of faculty records: ${count}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

main();
