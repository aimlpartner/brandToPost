<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/312f6b60-4c4b-4219-867b-b39701960c8a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set your environment variables in `.env.local` using `.env.example` as a template
3. Run the app:
   `npm run dev`

## Deploy to Hostinger

This project requires a Node.js host, not plain static hosting. Use a Hostinger plan that supports Node.js apps.

1. Push your repo to the server or deploy from Git.
2. In Hostinger, configure the environment variables listed in `.env.example`.
3. Set the start command to:
   `npm start`
4. If Hostinger does not automatically install dependencies, run:
   `npm install`

### Required environment variables

- `GEMINI_API_KEY`
- `APP_URL`
- `FIREBASE_SERVICE_ACCOUNT`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

### Hostinger-specific notes

- The app listens on `process.env.PORT` and `0.0.0.0`, which matches Hostinger Node deployment requirements.
- The `postinstall` script builds the frontend automatically after `npm install`.
- If you need to debug deployment, check the Hostinger logs and ensure all required env vars are present.
