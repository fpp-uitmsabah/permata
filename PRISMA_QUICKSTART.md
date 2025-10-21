# Prisma Database Integration - Quick Start Guide

This guide will help you get started with the Prisma database connection that has been set up for the Permata Faculty Directory application.

## What Was Implemented

✅ **Prisma ORM Setup**
- Prisma Client for database operations
- PostgreSQL database with Prisma Accelerate
- Database schema for faculty data

✅ **GitHub Actions Workflow**
- Automated database setup on push to main branch
- Uses `prisma/create-prisma-postgres-database-action@v1.0.3`
- Generates Prisma Client and pushes schema automatically

✅ **Configuration Files**
- `.env` - Local environment variables (git-ignored)
- `.env.example` - Template for environment setup
- `prisma/schema.prisma` - Database schema definition
- `.gitignore` - Excludes sensitive files from version control

✅ **Documentation**
- `DATABASE_README.md` - Comprehensive database setup guide
- `GITHUB_SECRETS_SETUP.md` - Instructions for configuring GitHub Secrets
- This file - Quick start overview

## Required Action: Configure GitHub Secret

**IMPORTANT**: Before the GitHub Actions workflow can run successfully, you must add the DATABASE_URL as a GitHub Secret:

1. Go to your repository settings
2. Navigate to Secrets and variables → Actions
3. Add a new secret named `DATABASE_URL` with the value:
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18yU0JRdUpwUjBHT1hYZGhscXU1Q2MiLCJhcGlfa2V5IjoiMDFLODFKUzJHWTNCUDk2MENDUk0yS04zMjUiLCJ0ZW5hbnRfaWQiOiJiNTIwZDQ2YzY1YTMzYmYwNWUyYTI4NTA5MGJjY2FiMWY5NTVlMDI0NzI3NjAyYTAwZTMxNTEyMzlmODE5NGUyIiwiaW50ZXJuYWxfc2VjcmV0IjoiMTExMzUyY2YtNDEzNC00ZWQxLWJhZTgtM2ZkZjU2NGJkODNmIn0.mPy7FwZF3mqWz6gL42wBvtYX737lFxRx7sswU261YdQ
   ```

See `GITHUB_SECRETS_SETUP.md` for detailed step-by-step instructions.

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Environment
```bash
# Copy the example environment file
cp .env.example .env

# The .env file already contains the DATABASE_URL
# Verify it's correct (it should match the one in the problem statement)
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Test Database Connection (Optional)
```bash
npm run test:db
```

### 5. Push Schema to Database
```bash
npm run prisma:push
```

This creates the database tables based on your schema.

## Database Schema

The database includes a `Faculty` model to store information about faculty members:

```prisma
model Faculty {
  id          String   @id @default(cuid())
  name        String
  title       String?
  department  String?
  email       String?  @unique
  phone       String?
  expertise   String[]
  bio         String?
  imageUrl    String?
  profileUrl  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Available NPM Scripts

- `npm run prisma:generate` - Generate Prisma Client for database operations
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:push` - Push schema changes directly to database (dev only)
- `npm run prisma:studio` - Open Prisma Studio (visual database editor)
- `npm run test:db` - Test database connection

## GitHub Actions Workflow

The workflow file `.github/workflows/prisma-database.yml` will:

1. **Trigger on**:
   - Push to `main` branch
   - Manual workflow dispatch

2. **Steps**:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Create/configure Prisma Postgres database
   - Generate Prisma Client
   - Push database schema

## Using Prisma in Your Application

### Import Prisma Client
```javascript
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
```

### Example: Create a Faculty Record
```javascript
const faculty = await prisma.faculty.create({
  data: {
    name: "Dr. John Smith",
    title: "Professor",
    department: "Computer Science",
    email: "john.smith@uitmsabah.edu.my",
    expertise: ["Artificial Intelligence", "Machine Learning"],
    bio: "Expert in AI and ML with 15 years of experience"
  }
});
```

### Example: Query Faculty
```javascript
// Get all faculty
const allFaculty = await prisma.faculty.findMany();

// Get faculty by email
const faculty = await prisma.faculty.findUnique({
  where: { email: "john.smith@uitmsabah.edu.my" }
});

// Search faculty by department
const csFaculty = await prisma.faculty.findMany({
  where: { department: "Computer Science" }
});
```

## Prisma Studio

For a visual interface to manage your database:

```bash
npm run prisma:studio
```

This opens a web-based GUI at http://localhost:5555 where you can:
- View all database tables
- Create, read, update, and delete records
- Run queries
- Manage relationships

## Security Best Practices

✅ **DO**:
- Use GitHub Secrets for credentials in CI/CD
- Keep `.env` file out of version control (already configured)
- Rotate API keys regularly
- Use environment variables for sensitive data

❌ **DON'T**:
- Commit `.env` file to git
- Share DATABASE_URL in public channels
- Hardcode credentials in application code
- Use production credentials in development

## Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Ensure `.env` file exists in project root
- Verify DATABASE_URL is set in `.env`
- For GitHub Actions, verify the secret is added

### "Can't reach database server"
- Check if DATABASE_URL is correct
- Verify API key hasn't expired
- Ensure you have internet connectivity
- Check Prisma Accelerate service status

### "Schema validation failed"
- Run `npx prisma validate` to check schema syntax
- Review error messages for specific issues
- Ensure proper Prisma syntax in schema.prisma

## Next Steps

1. ✅ Add DATABASE_URL secret to GitHub (see GITHUB_SECRETS_SETUP.md)
2. ✅ Merge this PR to main branch
3. ✅ Wait for GitHub Actions workflow to complete
4. ✅ Start using Prisma in your application
5. ✅ Create API endpoints that use the database

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Accelerate](https://www.prisma.io/accelerate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Prisma documentation
3. Check GitHub Actions logs for workflow issues
4. Verify all configuration steps were completed

---

**Setup Status**: ✅ Complete - Ready to use after adding GitHub Secret
**Last Updated**: October 2024
