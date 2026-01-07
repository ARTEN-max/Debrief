#!/bin/bash

# Komuchi Deployment Script
# This script helps you deploy Komuchi to various platforms

echo "🤖 Komuchi Deployment Helper"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your tokens before deploying."
    echo ""
    echo "Required values:"
    echo "  - SLACK_BOT_TOKEN (get from https://api.slack.com/apps)"
    echo "  - OPENAI_API_KEY (get from https://platform.openai.com/api-keys)"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

echo "Where would you like to deploy?"
echo "1) Railway (Recommended - Easiest)"
echo "2) Heroku"
echo "3) Run locally with ngrok (for testing)"
echo "4) Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying to Railway..."
        echo ""
        echo "Steps:"
        echo "1. Go to https://railway.app"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select this repository"
        echo "5. Add environment variables from your .env file"
        echo "6. Railway will deploy automatically!"
        echo ""
        echo "Your bot will be live at: https://your-app.railway.app"
        echo "Use this URL + /slack/events for Slack Event Subscriptions"
        ;;
    2)
        echo ""
        echo "📦 Deploying to Heroku..."

        # Check if heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo "⚠️  Heroku CLI not found. Install it from:"
            echo "https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi

        read -p "Enter your app name (e.g., my-komuchi-bot): " app_name

        # Load environment variables
        source .env

        echo "Creating Heroku app..."
        heroku create $app_name

        echo "Setting environment variables..."
        heroku config:set SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN
        heroku config:set OPENAI_API_KEY=$OPENAI_API_KEY

        echo "Deploying to Heroku..."
        git push heroku main

        echo ""
        echo "✅ Deployed! Your bot is live at:"
        heroku open
        echo ""
        echo "Use this URL + /slack/events for Slack Event Subscriptions"
        ;;
    3)
        echo ""
        echo "🧪 Running locally with ngrok..."

        # Check if ngrok is installed
        if ! command -v ngrok &> /dev/null; then
            echo "⚠️  ngrok not found. Install it from:"
            echo "https://ngrok.com/download"
            exit 1
        fi

        echo "Starting Flask server..."
        python3 bot.py &
        FLASK_PID=$!

        sleep 2

        echo "Starting ngrok tunnel..."
        ngrok http 3000 &
        NGROK_PID=$!

        echo ""
        echo "✅ Komuchi is running!"
        echo ""
        echo "Next steps:"
        echo "1. Go to http://localhost:4040 to see your ngrok URL"
        echo "2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
        echo "3. Add '/slack/events' to the end"
        echo "4. Use this in your Slack app Event Subscriptions"
        echo ""
        echo "Press Ctrl+C to stop both servers"

        # Wait for user to stop
        wait $FLASK_PID
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo "1. Go to https://api.slack.com/apps"
echo "2. Select your Komuchi app"
echo "3. Go to Event Subscriptions"
echo "4. Add your deployment URL + /slack/events"
echo "5. Subscribe to 'app_mention' event"
echo "6. Save changes and test!"
echo ""
echo "Need help? Check SETUP_GUIDE.md or email support@komuchi.ai"
