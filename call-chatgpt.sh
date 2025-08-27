#!/bin/bash

# Load environment variables from .env file
set -a
source <(grep -vE '^\s*#' .env | grep -vE '^\s*$')
set +a

PROMPT_FILE=$1
# Ensure OPENAI_API_KEY is loaded from the environment
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY is not set."
  exit 1
fi

MODEL="${OPENAI_MODEL:-gpt-4o}"

PROMPT=$(cat "${PROMPT_FILE}")

# Define your detailed prompt as a variable
detailed_prompt="Please create a short, concise summary of each of the following PRs, so that I can put it in my hypedoc to reference in the future.

It should:
- Emphasise the impact and benefits
- Be clear and concise
- Have a URL of the PR at the end of the line in brackets so I can click through to the PR (NOT a hyperlink, just the URL on its own)
- Be in reverse chronological order (most recent first)
- Be in plaintext, not markdown

Please follow the following example as a reference for desired format:
Feb 10, 2024:
- Successfully led the development of Project X's core module, improving system efficiency by 20%.
- Initiated and completed a code refactoring for the Legacy System, enhancing maintainability.
- Collaborated on the Integration Initiative, ensuring seamless connection between System A and B.
- Acted as the interim lead for the Deployment Team during critical release phases.

Jan 25, 2024:
- Spearheaded the documentation overhaul for Project Y, setting a new standard for project clarity.
- Managed cross-departmental teams to kickstart the Beta Launch of the New Platform.
- Coordinated with the Design Team to implement a new UI/UX for the Customer Portal.
"
# Construct the JSON payload for the OpenAI API
json_payload=$(jq -n \
    --arg prompt "$PROMPT" \
    --arg detailed_prompt "$detailed_prompt" \
    --arg model "$MODEL" \
    '{ "model": $model, "messages": [{ "role": "user", "content": ($detailed_prompt + "\n" + $prompt) }] }')

# Send the payload to the OpenAI API
response=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

# Process the response
error_message=$(echo "$response" | jq -r '.error.message // empty')
if [ -n "$error_message" ]; then
    echo "🤖 Error: $error_message"
    exit 1
fi

pr_description=$(echo "$response" | jq -r '.choices[0].message.content')
if [ -n "$pr_description" ]; then
    echo "$pr_description" | pbcopy
    echo "$pr_description"
    echo "(The description is copied to your clipboard.)"
else
    echo "Error: Unable to generate PR description."
    exit 1
fi
