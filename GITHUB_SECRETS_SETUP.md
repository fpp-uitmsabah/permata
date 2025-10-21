# GitHub Secrets Setup Instructions

## Adding DATABASE_URL Secret to GitHub Repository

To configure the Prisma database connection in GitHub Actions, you need to add the `DATABASE_URL` as a repository secret.

### Steps:

1. **Navigate to your GitHub repository**
   - Go to https://github.com/fpp-uitmsabah/permata

2. **Access Settings**
   - Click on the "Settings" tab in the repository menu

3. **Navigate to Secrets**
   - In the left sidebar, click on "Secrets and variables"
   - Select "Actions"

4. **Add New Secret**
   - Click the "New repository secret" button
   - Name: `DATABASE_URL`
   - Value: 
     ```
     prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18yU0JRdUpwUjBHT1hYZGhscXU1Q2MiLCJhcGlfa2V5IjoiMDFLODFKUzJHWTNCUDk2MENDUk0yS04zMjUiLCJ0ZW5hbnRfaWQiOiJiNTIwZDQ2YzY1YTMzYmYwNWUyYTI4NTA5MGJjY2FiMWY5NTVlMDI0NzI3NjAyYTAwZTMxNTEyMzlmODE5NGUyIiwiaW50ZXJuYWxfc2VjcmV0IjoiMTExMzUyY2YtNDEzNC00ZWQxLWJhZTgtM2ZkZjU2NGJkODNmIn0.mPy7FwZF3mqWz6gL42wBvtYX737lFxRx7sswU261YdQ
     ```
   - Click "Add secret"

5. **Verify Secret**
   - The secret should now appear in your list of repository secrets
   - The value will be hidden for security

## Security Notes

- ⚠️ **IMPORTANT**: The DATABASE_URL contains sensitive credentials (API key)
- Never commit the actual DATABASE_URL to the repository
- Always use GitHub Secrets for sensitive data in GitHub Actions
- The `.env` file is excluded from git via `.gitignore`
- For local development, copy `.env.example` to `.env` and add your credentials

## Workflow Trigger

Once the secret is added, the GitHub Actions workflow will:
- Run automatically when code is pushed to the `main` branch
- Can be triggered manually from the "Actions" tab → "Setup Prisma Database" → "Run workflow"

## Verifying the Setup

After adding the secret and running the workflow:

1. Go to the "Actions" tab in your repository
2. Click on the "Setup Prisma Database" workflow
3. View the latest run to see if all steps completed successfully
4. Check for green checkmarks indicating successful execution

## Troubleshooting

If the workflow fails:
- Verify the DATABASE_URL secret is correctly set
- Check that the API key in the DATABASE_URL is valid and not expired
- Review the workflow logs for specific error messages
- Ensure the Prisma schema is valid by running `npx prisma validate` locally
