# Komuchi - AI-Powered Slack Onboarding Assistant

Komuchi is an intelligent Slack bot that helps onboard new employees by answering their questions using your existing Slack conversation history. No documentation needed - it learns from your team's real conversations.

## Features

- **Instant Answers**: New employees get immediate responses to questions
- **Context-Aware**: Analyzes channel history to provide accurate answers
- **Zero Setup Knowledge Base**: Works with existing Slack conversations
- **Easy Integration**: Install in minutes, no complex setup
- **Privacy First**: Only accesses channels where invited
- **24/7 Availability**: Always ready to help new team members

## How It Works

1. Install Komuchi to your Slack workspace
2. Invite it to relevant channels (#onboarding, #general, etc.)
3. New employees mention @Komuchi with questions
4. Komuchi responds with AI-powered answers from channel history

## Quick Start

### Prerequisites

- Slack workspace with admin access
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Python 3.9+ (for local development)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourcompany/komuchi.git
cd komuchi
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
OPENAI_API_KEY=sk-your-openai-key
PORT=3000
```

#### 4. Create Slack App

Follow the detailed instructions in [SETUP_GUIDE.md](SETUP_GUIDE.md) to:
- Create a Slack app
- Configure bot permissions
- Enable event subscriptions
- Get your bot token

#### 5. Run Locally (for testing)

```bash
python bot.py
```

In another terminal, expose your local server:

```bash
ngrok http 3000
```

Use the ngrok URL in your Slack app's Event Subscriptions.

## Deployment

### Deploy to Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Click the button above
2. Connect your GitHub repository
3. Add environment variables:
   - `SLACK_BOT_TOKEN`
   - `OPENAI_API_KEY`
4. Deploy!

### Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
heroku config:set OPENAI_API_KEY=sk-your-key
git push heroku main
```

### Deploy to Other Platforms

Komuchi can be deployed to any platform that supports Python and Flask:
- Render
- Google Cloud Run
- AWS Elastic Beanstalk
- DigitalOcean App Platform

## Usage

Once installed and invited to a channel:

```
@Komuchi what's our PTO policy?
@Komuchi how do I submit expenses?
@Komuchi what did people say about onboarding?
```

## Configuration

### Customizing the AI Prompt

Edit `bot.py` and modify the system prompt in the `ask_question` function:

```python
{"role": "system", "content": "Your custom prompt here"}
```

### Adjusting Message History Limit

Change the `limit` parameter in `get_channel_messages`:

```python
response = slack_client.conversations_history(channel=channel_id, limit=100)
```

## File Structure

```
komuchi/
├── bot.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Heroku deployment config
├── runtime.txt           # Python version
├── .env.example          # Environment variables template
├── index.html            # Landing page
├── SETUP_GUIDE.md        # Detailed setup instructions
└── README.md             # This file
```

## Troubleshooting

### Bot doesn't respond
- Ensure bot is invited to the channel: `/invite @Komuchi`
- Check Event Subscriptions URL is verified
- Verify bot has `app_mentions:read` and `chat:write` permissions

### "Not in channel" error
- Invite the bot to the channel first

### "Invalid auth" error
- Check `SLACK_BOT_TOKEN` is correct
- Ensure token starts with `xoxb-`

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting tips.

## Security Best Practices

1. **Never commit tokens**: Keep `.env` file in `.gitignore`
2. **Use environment variables**: Never hardcode credentials
3. **Limit channel access**: Only invite bot to necessary channels
4. **Rotate keys regularly**: Update API keys periodically
5. **Monitor usage**: Track bot activity for suspicious behavior

## Cost Estimation

### OpenAI API Costs

Based on GPT-4 pricing:
- ~$0.03 per question (average)
- 100 questions/day = ~$3/day = ~$90/month
- Optimize by using GPT-3.5-turbo for lower costs

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- **Documentation**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Email**: support@komuchi.ai
- **Issues**: [GitHub Issues](https://github.com/yourcompany/komuchi/issues)

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Custom knowledge base upload
- [ ] Integration with Notion/Confluence
- [ ] Slack slash commands
- [ ] Question categorization
- [ ] Automated onboarding workflows

## About

Built with ❤️ to make employee onboarding seamless.

---

**Made with [Flask](https://flask.palletsprojects.com/), [Slack SDK](https://slack.dev/python-slack-sdk/), and [OpenAI](https://openai.com/)**
