#!/bin/bash

# Load environment variables from .env file
set -a
source <(cat .env | grep -v '^#' | grep -v '^$')
set +a

PROMPT_FILE=$1
OPENAI_API_KEY=$OPENAI_API_KEY # Now using the variable from .env
PROMPT=$(cat "${PROMPT_FILE}")

# Define your detailed prompt as a variable
detailed_prompt="Please create a short, concise summary of each of the following PRs, so that I can put it in my hypedoc to reference in the future.

It should:
- Emphasise the impact and benefits
- Be clear and concise
- Have a URL of the PR at the end of the line in brackets so I can click through to the PR
- Be in reverse chronological order (most recent first)

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

# Use jq to create the JSON payload with the variable
json_payload=$(jq -n \
    --arg prompt "$PROMPT" \
    --arg detailed_prompt "$detailed_prompt" \
    '{
        "messages": [
            {
                "role": "user",
                "content": ($detailed_prompt + $prompt)
            }
        ],
        "model": "gpt-4-0125-preview"
    }')

# Send the diff to OpenAI API and ask for a PR description
response=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

# Check if there's an "error" key in the response
error_message=$(echo "$response" | jq -r '.error.message // empty')

if [[ -n $error_message ]]; then
    echo "🤖 Error: $error_message"
    exit 1
else
    # Extract the text from the response
    pr_description=$(echo "$response" | jq -r '.choices[0].message.content')

    # Check if pr_description is empty
    if [[ -n $pr_description ]]; then
        # Copy the PR description to the clipboard
        echo "$pr_description" | pbcopy

        # Output the PR description
        echo "
$pr_description

(This is copied to your clipboard.)"
    else
        echo "Error: Unable to generate PR description."
        exit 1
    fi
fi
