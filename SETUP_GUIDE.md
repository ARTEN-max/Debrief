# Komuchi - Company Setup Guide

This guide will help you set up Komuchi for your Slack workspace in under 15 minutes.

## Prerequisites

- Admin access to your Slack workspace
- OpenAI API key (get one at https://platform.openai.com)

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name your app "Komuchi" (or your preferred name)
4. Select your workspace
5. Click "Create App"

## Step 2: Configure Bot Permissions

1. In the left sidebar, click "OAuth & Permissions"
2. Scroll down to "Bot Token Scopes"
3. Add the following scopes:
   - `app_mentions:read` - To receive @mentions
   - `channels:history` - To read public channel messages
   - `channels:read` - To list channels
   - `chat:write` - To send messages
   - `groups:history` - To read private channel messages (optional)
   - `groups:read` - To list private channels (optional)

## Step 3: Enable Event Subscriptions

1. In the left sidebar, click "Event Subscriptions"
2. Toggle "Enable Events" to ON
3. You'll need your Request URL (we'll set this up after deployment - see Step 6)
4. Under "Subscribe to bot events", add:
   - `app_mention` - To respond when users mention the bot

## Step 4: Install App to Workspace

1. In the left sidebar, click "Install App"
2. Click "Install to Workspace"
3. Review permissions and click "Allow"
4. **Copy your Bot User OAuth Token** (starts with `xoxb-`)
   - You'll need this for the next step

## Step 5: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Keep this secure - you won't see it again**

## Step 6: Deploy Komuchi

### Option A: Deploy to Railway (Recommended - Easiest)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Komuchi repository
5. Add environment variables:
   - `SLACK_BOT_TOKEN` = your token from Step 4
   - `OPENAI_API_KEY` = your key from Step 5
6. Railway will give you a public URL (e.g., `https://your-app.railway.app`)
7. Copy this URL

### Option B: Deploy to Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. In your terminal:
   ```bash
   heroku create your-app-name
   heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
   heroku config:set OPENAI_API_KEY=sk-your-key
   git push heroku main
   ```
3. Your URL will be `https://your-app-name.herokuapp.com`

### Option C: Deploy Manually (ngrok for testing)

1. Install ngrok: https://ngrok.com/download
2. In terminal:
   ```bash
   # Start the bot
   python3 bot.py

   # In another terminal, start ngrok
   ngrok http 3000
   ```
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. **Note: ngrok URLs change each time you restart**

## Step 7: Complete Slack Event Setup

1. Go back to https://api.slack.com/apps
2. Select your Komuchi app
3. Go to "Event Subscriptions"
4. In "Request URL", enter: `https://your-deployment-url/slack/events`
   - Example: `https://your-app.railway.app/slack/events`
5. Wait for the green "Verified" checkmark
6. Click "Save Changes"

## Step 8: Invite Bot to Channels

1. Open Slack
2. Go to any channel where you want Komuchi to work (e.g., #onboarding, #general)
3. Type: `/invite @Komuchi`
4. The bot will join the channel

## Step 9: Test It Out!

1. In a channel where Komuchi is present, type:
   ```
   @Komuchi what did people say about onboarding?
   ```
2. Komuchi should respond with an AI-generated answer based on the channel history!

## Troubleshooting

### Bot doesn't respond

- Check that the bot is in the channel (`/invite @Komuchi`)
- Verify Event Subscriptions URL is verified (green checkmark)
- Check bot permissions include `app_mentions:read` and `chat:write`
- Look at deployment logs for errors

### "Not in channel" error

- Make sure you invited the bot to the channel: `/invite @Komuchi`

### "Invalid auth" error

- Check that your `SLACK_BOT_TOKEN` is correct
- Make sure it starts with `xoxb-`
- Reinstall the app if you regenerated tokens

### Event URL not verifying

- Make sure your server is running
- Check the URL ends with `/slack/events`
- Try redeploying and updating the URL

## Best Practices

1. **Invite to relevant channels**: Add Komuchi to channels like:
   - #onboarding
   - #general
   - #engineering
   - #hr
   - #company-culture

2. **Let it learn**: The more conversations in the channel, the better Komuchi's answers

3. **Keep history**: Don't delete important Slack messages - they're Komuchi's knowledge base

4. **Monitor usage**: Check which questions employees ask most to improve documentation

## Support

Need help? Contact us:
- Email: support@komuchi.ai
- Issues: https://github.com/yourcompany/komuchi/issues

## Next Steps

- Set up analytics to track common questions
- Customize the AI prompt for your company's tone
- Add more channels as your team grows
- Configure automated reports on onboarding efficiency
