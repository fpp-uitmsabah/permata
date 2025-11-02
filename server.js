/**
 * Simple API Server for Portfolio Authentication and Management
 * Handles staff ID authentication and portfolio updates
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('./generated/prisma');
const admin = require('firebase-admin');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Initialize Firebase Admin (for custom token generation)
// Note: You'll need to download and add your Firebase service account key
let firebaseAdmin = null;
try {
    const serviceAccount = require('./firebase-service-account.json');
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.warn('⚠️ Firebase Admin not configured. Staff ID authentication will not work.');
    console.warn('   Please add firebase-service-account.json to enable this feature.');
}

/**
 * Staff ID Authentication Endpoint
 * Generates a custom Firebase token for staff ID login
 */
app.post('/api/auth/staff-login', async (req, res) => {
    try {
        const { employeeId, secretCode } = req.body;

        if (!employeeId || !secretCode) {
            return res.status(400).json({ error: 'Employee ID and secret code are required' });
        }

        // Find faculty member in database
        const faculty = await prisma.faculty.findFirst({
            where: {
                employeeId: employeeId,
                secretCode: secretCode,
                canEdit: true
            }
        });

        if (!faculty) {
            return res.status(401).json({ error: 'Invalid credentials or unauthorized' });
        }

        if (!firebaseAdmin) {
            return res.status(503).json({ 
                error: 'Firebase Admin not configured. Please contact system administrator.' 
            });
        }

        // Generate custom token with employee ID claim
        const customToken = await admin.auth().createCustomToken(faculty.id, {
            employeeId: faculty.employeeId,
            email: faculty.email,
            canEdit: faculty.canEdit
        });

        res.json({
            customToken,
            facultyId: faculty.id,
            name: faculty.name
        });

    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * Verify Firebase token middleware
 */
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    if (!firebaseAdmin) {
        return res.status(503).json({ 
            error: 'Firebase Admin not configured. Please contact system administrator.' 
        });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Update Portfolio Endpoint
 * Allows authenticated faculty to update their portfolio
 */
app.post('/api/portfolio/update', verifyToken, async (req, res) => {
    try {
        const { employeeId, changes } = req.body;
        const userEmployeeId = req.user.employeeId;

        // Verify user is authorized to update this portfolio
        if (userEmployeeId !== employeeId) {
            return res.status(403).json({ error: 'Not authorized to update this portfolio' });
        }

        // Find the faculty member
        const faculty = await prisma.faculty.findFirst({
            where: { employeeId: employeeId }
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        // Update allowed fields
        const allowedFields = ['bio', 'phone', 'expertise'];
        const updateData = {};

        for (const [field, value] of Object.entries(changes)) {
            if (allowedFields.includes(field)) {
                updateData[field] = value;
            }
        }

        // Update faculty record
        const updatedFaculty = await prisma.faculty.update({
            where: { id: faculty.id },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Portfolio updated successfully',
            data: updatedFaculty
        });

    } catch (error) {
        console.error('Portfolio update error:', error);
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
});

/**
 * Get Faculty Portfolio Endpoint
 * Retrieves faculty member data
 */
app.get('/api/portfolio/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        const faculty = await prisma.faculty.findFirst({
            where: { employeeId: employeeId }
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        // Don't send sensitive data
        const { secretCode, ...publicData } = faculty;

        res.json(publicData);

    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({ error: 'Failed to retrieve portfolio' });
    }
});

/**
 * Setup Secret Code Endpoint (Admin only)
 * Allows admin to set up authentication for faculty members
 */
app.post('/api/admin/setup-auth', async (req, res) => {
    try {
        const { employeeId, secretCode, googleEmail, canEdit } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }

        const faculty = await prisma.faculty.update({
            where: { employeeId: employeeId },
            data: {
                secretCode: secretCode || null,
                googleEmail: googleEmail || null,
                canEdit: canEdit !== undefined ? canEdit : true,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Authentication setup completed',
            facultyId: faculty.id,
            name: faculty.name
        });

    } catch (error) {
        console.error('Setup auth error:', error);
        res.status(500).json({ error: 'Failed to setup authentication' });
    }
});

/**
 * Social Media Features - Like/React to Faculty Profile
 */
app.post('/api/social/like', async (req, res) => {
    try {
        const { facultyId, userId, userName, reactionType = 'like' } = req.body;

        if (!facultyId || !userId) {
            return res.status(400).json({ error: 'Faculty ID and user ID are required' });
        }

        // Check if faculty exists
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId }
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        // Upsert like (create or update)
        const like = await prisma.like.upsert({
            where: {
                facultyId_userId: {
                    facultyId,
                    userId
                }
            },
            update: {
                reactionType,
                userName
            },
            create: {
                facultyId,
                userId,
                userName,
                reactionType
            }
        });

        // Get total likes count
        const likesCount = await prisma.like.count({
            where: { facultyId }
        });

        res.json({
            success: true,
            like,
            likesCount
        });

    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to process like' });
    }
});

/**
 * Remove Like
 */
app.delete('/api/social/like', async (req, res) => {
    try {
        const { facultyId, userId } = req.body;

        if (!facultyId || !userId) {
            return res.status(400).json({ error: 'Faculty ID and user ID are required' });
        }

        await prisma.like.delete({
            where: {
                facultyId_userId: {
                    facultyId,
                    userId
                }
            }
        });

        // Get updated likes count
        const likesCount = await prisma.like.count({
            where: { facultyId }
        });

        res.json({
            success: true,
            likesCount
        });

    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({ error: 'Failed to remove like' });
    }
});

/**
 * Get Likes for a Faculty Profile
 */
app.get('/api/social/likes/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;

        const likes = await prisma.like.findMany({
            where: { facultyId },
            orderBy: { createdAt: 'desc' }
        });

        const likesCount = likes.length;
        const reactionCounts = likes.reduce((acc, like) => {
            acc[like.reactionType] = (acc[like.reactionType] || 0) + 1;
            return acc;
        }, {});

        res.json({
            likesCount,
            reactionCounts,
            likes
        });

    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ error: 'Failed to retrieve likes' });
    }
});

/**
 * Add Comment to Faculty Profile
 */
app.post('/api/social/comment', async (req, res) => {
    try {
        const { facultyId, userId, userName, userEmail, content } = req.body;

        if (!facultyId || !userId || !userName || !content) {
            return res.status(400).json({ 
                error: 'Faculty ID, user ID, user name, and content are required' 
            });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        // Check if faculty exists
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId }
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        const comment = await prisma.comment.create({
            data: {
                facultyId,
                userId,
                userName,
                userEmail,
                content: content.trim()
            }
        });

        // Get total comments count
        const commentsCount = await prisma.comment.count({
            where: { facultyId }
        });

        res.json({
            success: true,
            comment,
            commentsCount
        });

    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

/**
 * Get Comments for a Faculty Profile
 */
app.get('/api/social/comments/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const comments = await prisma.comment.findMany({
            where: { facultyId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const commentsCount = await prisma.comment.count({
            where: { facultyId }
        });

        res.json({
            comments,
            commentsCount,
            hasMore: commentsCount > parseInt(offset) + parseInt(limit)
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to retrieve comments' });
    }
});

/**
 * Delete Comment (only by comment author)
 */
app.delete('/api/social/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if comment exists and belongs to user
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

/**
 * Follow a Faculty Member
 */
app.post('/api/social/follow', async (req, res) => {
    try {
        const { facultyId, userId, userName, userEmail } = req.body;

        if (!facultyId || !userId || !userName) {
            return res.status(400).json({ 
                error: 'Faculty ID, user ID, and user name are required' 
            });
        }

        // Check if faculty exists
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId }
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty member not found' });
        }

        // Create or update follow
        const follow = await prisma.follow.upsert({
            where: {
                facultyId_userId: {
                    facultyId,
                    userId
                }
            },
            update: {
                userName,
                userEmail
            },
            create: {
                facultyId,
                userId,
                userName,
                userEmail
            }
        });

        // Get total followers count
        const followersCount = await prisma.follow.count({
            where: { facultyId }
        });

        res.json({
            success: true,
            follow,
            followersCount
        });

    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Failed to follow' });
    }
});

/**
 * Unfollow a Faculty Member
 */
app.delete('/api/social/follow', async (req, res) => {
    try {
        const { facultyId, userId } = req.body;

        if (!facultyId || !userId) {
            return res.status(400).json({ error: 'Faculty ID and user ID are required' });
        }

        await prisma.follow.delete({
            where: {
                facultyId_userId: {
                    facultyId,
                    userId
                }
            }
        });

        // Get updated followers count
        const followersCount = await prisma.follow.count({
            where: { facultyId }
        });

        res.json({
            success: true,
            followersCount
        });

    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Failed to unfollow' });
    }
});

/**
 * Get Followers for a Faculty Profile
 */
app.get('/api/social/followers/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;

        const followers = await prisma.follow.findMany({
            where: { facultyId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            followersCount: followers.length,
            followers
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to retrieve followers' });
    }
});

/**
 * Get Social Stats for a Faculty Profile
 */
app.get('/api/social/stats/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;

        const [likesCount, commentsCount, followersCount] = await Promise.all([
            prisma.like.count({ where: { facultyId } }),
            prisma.comment.count({ where: { facultyId } }),
            prisma.follow.count({ where: { facultyId } })
        ]);

        res.json({
            likesCount,
            commentsCount,
            followersCount
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve stats' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Portfolio API is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Portfolio API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = app;
