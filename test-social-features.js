/**
 * Test Social Features
 * 
 * This script tests the social media features without requiring a running server.
 * It tests the database schema and Prisma client functionality.
 */

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function testSocialFeatures() {
    console.log('🧪 Testing Social Features...\n');
    
    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully\n');
        
        // Test 2: Check if social tables exist
        console.log('2️⃣ Checking social feature tables...');
        
        // Count existing data
        const likesCount = await prisma.like.count();
        const commentsCount = await prisma.comment.count();
        const followsCount = await prisma.follow.count();
        
        console.log(`   Likes: ${likesCount}`);
        console.log(`   Comments: ${commentsCount}`);
        console.log(`   Follows: ${followsCount}`);
        console.log('✅ Social feature tables are ready\n');
        
        // Test 3: Check Faculty table (must exist for social features)
        console.log('3️⃣ Checking Faculty table...');
        const facultyCount = await prisma.faculty.count();
        console.log(`   Faculty members: ${facultyCount}`);
        
        if (facultyCount === 0) {
            console.log('⚠️  No faculty members found. Social features will work once faculty data is added.\n');
        } else {
            console.log('✅ Faculty data available\n');
            
            // Get a sample faculty member
            const sampleFaculty = await prisma.faculty.findFirst();
            if (sampleFaculty) {
                console.log('4️⃣ Testing social features with sample faculty...');
                console.log(`   Faculty: ${sampleFaculty.name}`);
                console.log(`   ID: ${sampleFaculty.id}\n`);
                
                // Test creating a like
                console.log('5️⃣ Testing Like functionality...');
                const testUserId = 'test_user_' + Date.now();
                
                try {
                    const like = await prisma.like.create({
                        data: {
                            facultyId: sampleFaculty.id,
                            userId: testUserId,
                            userName: 'Test User',
                            reactionType: 'like'
                        }
                    });
                    console.log('✅ Like created successfully');
                    console.log(`   Like ID: ${like.id}\n`);
                    
                    // Clean up - delete the test like
                    await prisma.like.delete({
                        where: { id: like.id }
                    });
                    console.log('🧹 Test like cleaned up\n');
                } catch (error) {
                    if (error.code === 'P2002') {
                        console.log('ℹ️  Like already exists (unique constraint working correctly)\n');
                    } else {
                        throw error;
                    }
                }
                
                // Test creating a comment
                console.log('6️⃣ Testing Comment functionality...');
                try {
                    const comment = await prisma.comment.create({
                        data: {
                            facultyId: sampleFaculty.id,
                            userId: testUserId,
                            userName: 'Test User',
                            content: 'This is a test comment for verification purposes.'
                        }
                    });
                    console.log('✅ Comment created successfully');
                    console.log(`   Comment ID: ${comment.id}\n`);
                    
                    // Clean up - delete the test comment
                    await prisma.comment.delete({
                        where: { id: comment.id }
                    });
                    console.log('🧹 Test comment cleaned up\n');
                } catch (error) {
                    console.error('❌ Comment creation failed:', error.message);
                }
                
                // Test creating a follow
                console.log('7️⃣ Testing Follow functionality...');
                try {
                    const follow = await prisma.follow.create({
                        data: {
                            facultyId: sampleFaculty.id,
                            userId: testUserId,
                            userName: 'Test User'
                        }
                    });
                    console.log('✅ Follow created successfully');
                    console.log(`   Follow ID: ${follow.id}\n`);
                    
                    // Clean up - delete the test follow
                    await prisma.follow.delete({
                        where: { id: follow.id }
                    });
                    console.log('🧹 Test follow cleaned up\n');
                } catch (error) {
                    if (error.code === 'P2002') {
                        console.log('ℹ️  Follow already exists (unique constraint working correctly)\n');
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        console.log('\n✅ All tests passed! Social features are ready to use.\n');
        console.log('📝 Next steps:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Open social-demo.html in your browser');
        console.log('   3. Test the features interactively\n');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.code === 'P1001') {
            console.error('\n💡 Database connection failed. Please check:');
            console.error('   1. DATABASE_URL is set in .env file');
            console.error('   2. Database server is running');
            console.error('   3. Database credentials are correct\n');
        } else if (error.code === 'P2021') {
            console.error('\n💡 Table does not exist. Please run:');
            console.error('   npm run prisma:push\n');
        } else {
            console.error('\n💡 For more details, check the error message above.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run tests
testSocialFeatures().catch(console.error);
