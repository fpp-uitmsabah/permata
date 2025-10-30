/**
 * Simple API Server for Portfolio Authentication and Management
 * Handles staff ID authentication and portfolio updates
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

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
