# Resume Generation Fix for Vercel Deployment

## Problem
Resume generation worked locally but failed on Vercel because Puppeteer requires Chrome/Chromium browser, which is not available in Vercel's serverless environment.

## Solution
Switched from local Puppeteer to Browserless.io service, which provides Chrome as a service compatible with serverless platforms.

## Setup Instructions

### 1. Get Browserless.io API Key
1. Go to [https://browserless.io](https://browserless.io)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Environment Variables
Add the following environment variable to your Vercel project:

```
BROWSERLESS_API_KEY=your_api_key_here
```

### 3. Local Development
For local development, you can either:
- Set the `BROWSERLESS_API_KEY` in your `.env.local` file
- Leave it empty to use Browserless.io's free tier (limited requests)

## How it Works
- The API now connects to Browserless.io's remote Chrome instances
- No local Chrome installation required
- Works in serverless environments like Vercel
- Maintains the same PDF generation quality

## Testing
1. Test locally with your API key
2. Deploy to Vercel with the environment variable set
3. Verify resume generation works for student users
