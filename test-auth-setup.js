#!/usr/bin/env node

/**
 * Test script to verify database setup and authentication system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseSetup() {
    console.log('\n🔍 Testing Database Setup...\n');

    try {
        // Test 1: Database connection
        console.log('1. Testing database connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected successfully\n');

        // Test 2: Count faculty members
        console.log('2. Counting faculty members...');
        const count = await prisma.faculty.count();
        console.log(`   ✅ Found ${count} faculty members in database\n`);

        // Test 3: Check for faculty with authentication setup
        console.log('3. Checking authentication setup...');
        const authConfigured = await prisma.faculty.count({
            where: {
                OR: [
                    { secretCode: { not: null } },
                    { googleEmail: { not: null } }
                ],
                canEdit: true
            }
        });
        console.log(`   ℹ️  ${authConfigured} faculty members have authentication configured\n`);

        // Test 4: List faculty members that can edit
        if (authConfigured > 0) {
            console.log('4. Faculty members with edit access:');
            const editableFaculty = await prisma.faculty.findMany({
                where: {
                    canEdit: true,
                    OR: [
                        { secretCode: { not: null } },
                        { googleEmail: { not: null } }
                    ]
                },
                select: {
                    employeeId: true,
                    name: true,
                    email: true,
                    googleEmail: true,
                    canEdit: true
                },
                take: 10
            });

            editableFaculty.forEach((faculty, index) => {
                console.log(`   ${index + 1}. ${faculty.name} (ID: ${faculty.employeeId})`);
                if (faculty.googleEmail) {
                    console.log(`      - Google Email: ${faculty.googleEmail}`);
                }
                if (faculty.canEdit) {
                    console.log(`      - Can Edit: Yes`);
                }
            });
            console.log('');
        }

        // Test 5: Schema validation
        console.log('5. Validating schema fields...');
        const sampleFaculty = await prisma.faculty.findFirst();
        if (sampleFaculty) {
            const requiredFields = ['id', 'name', 'employeeId', 'canEdit', 'createdAt', 'updatedAt'];
            const authFields = ['secretCode', 'googleEmail'];
            
            const hasRequiredFields = requiredFields.every(field => field in sampleFaculty);
            const hasAuthFields = authFields.every(field => field in sampleFaculty);
            
            if (hasRequiredFields && hasAuthFields) {
                console.log('   ✅ Schema includes all required authentication fields\n');
            } else {
                console.log('   ⚠️  Schema may be missing some fields\n');
            }
        }

        console.log('✅ All database tests passed!\n');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure DATABASE_URL is set in .env file');
        console.error('2. Run: npm run prisma:generate');
        console.error('3. Run: npm run prisma:push\n');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function suggestNextSteps() {
    console.log('📋 Next Steps:\n');
    
    try {
        const authConfigured = await prisma.faculty.count({
            where: {
                OR: [
                    { secretCode: { not: null } },
                    { googleEmail: { not: null } }
                ],
                canEdit: true
            }
        });

        if (authConfigured === 0) {
            console.log('1. ⚠️  No faculty members have authentication configured yet.');
            console.log('   → Start the server: npm run dev');
            console.log('   → Open: http://localhost:3000/admin-auth-setup.html');
            console.log('   → Configure authentication for faculty members\n');
        } else {
            console.log('1. ✅ Some faculty members already have authentication configured');
            console.log('   → You can start testing the authentication system\n');
        }

        console.log('2. 🔥 Configure Firebase Admin SDK:');
        console.log('   → Download service account key from Firebase Console');
        console.log('   → Save as: firebase-service-account.json');
        console.log('   → This enables Staff ID authentication\n');

        console.log('3. 🚀 Start the API server:');
        console.log('   → Run: npm run dev');
        console.log('   → Server will be available at: http://localhost:3000\n');

        console.log('4. 🧪 Test authentication:');
        console.log('   → Open: portfolio-template-with-auth.html');
        console.log('   → Try signing in with Google or Staff ID\n');

    } catch (error) {
        console.error('Error checking next steps:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Run tests
(async () => {
    await testDatabaseSetup();
    await suggestNextSteps();
})();
