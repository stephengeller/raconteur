#!/bin/bash

dest_branch="origin/${1:-"main"}"

# Diff the current branch against origin/main
diff_output=$(git diff $dest_branch)
json_safe_diff=$(jq -Rs . <<< "$diff_output")
OPENAI_API_KEY=$(cat ~/.openai_api_key)

# Check for a PR template in a case-insensitive manner
echo "🤖 Looking for a pull request template in $(pwd)/.github..."
template_path=$(find .github -type f -iname "pull_request_template.md" | head -n 1)
template_content=""

if [[ -n $template_path ]]; then
   echo "🤖 PR template found at $template_path, will format accordingly based on the diff with ${dest_branch}."
  template_content=$(cat "$template_path" | jq -Rs .)
  
read -r -d '' system_content <<EOF
You are a helpful assistant. Generate a detailed and structured PR description for software changes using the provided git diff. 
Make the PR description fit this pull request template format so that I can copy-paste it into GitHub.
EOF
    system_content+="$template_content"
else
  echo "🤖 No PR template found, will generate a generic PR description."
read -r -d '' system_content <<EOF
You are a helpful assistant. Generate a detailed and structured PR for software changes using the provided git diff. 
Make the PR friendly and easy to read, using emojis where appropriate.
EOF

  system_content+="\nEnsure the PR has sections like 'Title', 'Description', 'Changes' and 'Notes'. "
fi

echo $system_content
exit 0

# Use jq to create the JSON payload
json_payload=$(jq -n \
    --arg system_content "$system_content" \
    --arg json_safe_diff "$json_safe_diff" \
    '{
        "messages": [
            {
                "role": "system",
                "content": $system_content
            },
            {
                "role": "user",
                "content": $json_safe_diff
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
error_message=$(echo $response | jq -r '.error.message // empty')

if [[ -n $error_message ]]; then
    echo "🤖 Error: $error_message"
    exit 1
else
    # Extract the text from the response
    pr_description=$(echo $response | jq -r '.choices[0].message.content')

    # Check if pr_description is empty
    if [[ -n $pr_description ]]; then
        # Copy the PR description to the clipboard
        echo "$pr_description" | pbcopy

        # Output the PR description
        echo "🤖 PR Description based on the diff with ${dest_branch}:
$pr_description
(The description is copied to your clipboard.)"
    else
        echo "Error: Unable to generate PR description."
        exit 1
    fi
fi
