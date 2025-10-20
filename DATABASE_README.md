# Prisma Database Setup

This project uses Prisma ORM with Prisma Postgres (Accelerate) for database management.

## Database Connection

The application is configured to connect to a Prisma Postgres database using Prisma Accelerate.

### Database URL Format
```
prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env` with your actual Prisma Accelerate API key.

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Push Database Schema
```bash
npm run prisma:push
```

This will create the database tables based on your Prisma schema.

## Available Scripts

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:push` - Push schema changes to database (development)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Database Schema

### Faculty Model
The database includes a `Faculty` model with the following fields:

- `id` - Unique identifier
- `name` - Faculty member's full name
- `title` - Academic title (e.g., Professor, Associate Professor)
- `department` - Department affiliation
- `email` - Email address (unique)
- `phone` - Contact phone number
- `expertise` - Array of expertise areas
- `bio` - Biography/description
- `imageUrl` - Profile image URL
- `profileUrl` - Profile page URL
- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp

## GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/prisma-database.yml`) that:

1. Sets up Node.js environment
2. Installs dependencies
3. Creates/configures Prisma Postgres database
4. Generates Prisma Client
5. Pushes database schema

The workflow runs automatically on pushes to the `main` branch or can be triggered manually.

## GitHub Secrets

Make sure to add the following secret to your GitHub repository:

- `DATABASE_URL` - Your Prisma Postgres connection string with Accelerate API key

To add secrets:
1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add `DATABASE_URL` with your connection string

## Prisma Studio

To view and manage your database visually:

```bash
npm run prisma:studio
```

This will open a browser-based database management interface.

## Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Accelerate](https://www.prisma.io/accelerate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

## Notes

- The `.env` file is excluded from version control (via `.gitignore`)
- Database credentials should never be committed to the repository
- Use GitHub Secrets for storing credentials in CI/CD pipelines
