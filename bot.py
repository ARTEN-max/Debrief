from flask import Flask, request, jsonify
from slack_sdk import WebClient
import requests
import os

app = Flask(__name__)

SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not SLACK_BOT_TOKEN or not OPENAI_API_KEY:
    raise ValueError("Missing required environment variables. Please set SLACK_BOT_TOKEN and OPENAI_API_KEY")

slack_client = WebClient(token=SLACK_BOT_TOKEN)

def get_channel_messages(channel_id):
    response = slack_client.conversations_history(channel=channel_id, limit=100)
    return response["messages"]

def ask_question(messages, question):
    context = "\n".join([
        f"- {msg.get('text', '')}"
        for msg in messages
        if msg.get('text')
    ])

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are helping onboard a new employee by answering questions based on Slack conversation history. Keep answers concise and helpful."},
                {"role": "user", "content": f"Based on these Slack messages:\n{context}\n\nAnswer this question: {question}"}
            ]
        }
    )

    return response.json()["choices"][0]["message"]["content"]

@app.route("/slack/events", methods=["POST"])
def slack_events():
    data = request.json
    print(f"Received event: {data}")

    # Slack sends a challenge on first setup
    if "challenge" in data:
        print("Challenge received")
        return jsonify({"challenge": data["challenge"]})

    # Ignore retry attempts
    if request.headers.get("X-Slack-Retry-Num"):
        print("Ignoring retry")
        return jsonify({"status": "ok"})

    # Handle app_mention event
    if "event" in data:
        event = data["event"]
        print(f"Event type: {event.get('type')}")

        if event["type"] == "app_mention":
            print(f"App mention received: {event.get('text')}")

            # Extract the question (remove the bot mention)
            text = event["text"]
            question = text.split(">", 1)[1].strip() if ">" in text else text
            print(f"Question: {question}")

            channel_id = event["channel"]

            try:
                # Get messages and answer
                messages = get_channel_messages(channel_id)
                print(f"Got {len(messages)} messages")

                answer = ask_question(messages, question)
                print(f"Answer: {answer}")

                # Post answer back to Slack
                response = slack_client.chat_postMessage(
                    channel=channel_id,
                    text=answer
                )
                print(f"Posted message: {response}")
            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
