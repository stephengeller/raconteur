# PR Hypedocifier

PR Hypedocifier is a tool designed to summarize merged pull requests for a given GitHub user, emphasizing the impact and benefits of each PR. It uses the GitHub and OpenAI APIs to fetch PR information and generate concise summaries.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v12 or later recommended)
- yarn (usually comes with Node.js)
- jq (command-line JSON processor)

## Setup

### Automated Setup

To simplify the initial setup process, use the setup script that guides you through installing dependencies, generating necessary tokens, and configuring your `.env` file.

To run the setup script, navigate to your project directory in the terminal and execute:

```bash
./setup.sh
```

### Manual Setup

Follow the prompts and instructions in the terminal to complete your setup.

#### **Clone the repository and install dependencies**
```bash
git clone https://github.com/stephengeller/pull-request-hypedoc
cd pull-request-hypedoc
yarn install
```

#### **Environment Configuration**

Secure handling of sensitive information such as GitHub tokens and OpenAI API keys is managed through a .env file.

- [Generate a new Personal Access Token (PAT) from GitHub with](https://github.com/settings/tokens) `repo` scope.
- Obtain an API key from https://platform.openai.com/api-keys (SSO with your squareup account)
- Create a .env file in the root of your project and open it in a text editor.
- Add your GitHub token and OpenAI API key to the .env file in the following format:
```bash
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
GITHUB_USERNAME=your_github_username_here
````
  Replace `your_github_token_here` and `your_openai_api_key_here` with your actual GitHub token and OpenAI API key.

## **Usage**
To run the summarizer, execute:
```bash
yarn start
```

This will fetch merged PRs, generate summaries, and copy the latest summary to your clipboard.

## Configuring the PR Fetch Period

By default, PR Hypedocifier fetches pull requests merged within the last 2 weeks. You can customize this period by setting environment variables in your `.env` file.

1. **PR_FETCH_PERIOD_VALUE**: Specifies the numerical value of the time period.
2. **PR_FETCH_PERIOD_UNIT**: Specifies the unit of the time period (e.g., `days`, `weeks`, `months`).

For example, to fetch PRs from the last 3 months, your `.env` file should include:

```plaintext
PR_FETCH_PERIOD_VALUE=3
PR_FETCH_PERIOD_UNIT=months
```

## Customizing the Detailed Prompt

The script includes a section for defining a detailed prompt that guides the generation of pull request summaries. You can customize this prompt to fit your specific needs or preferences.

1. Open `call-chatgpt.sh` in your preferred text editor.
2. Locate the `detailed_prompt` variable definition. It should look like this:

    ```bash
    detailed_prompt="Please create a short, concise summary of each of the following PRs, so that I can put it in my hypedoc to reference in the future. [Your detailed instructions here]"
    ```

3. Modify the text within the quotation marks to update the instructions according to your requirements. Ensure to keep the prompt clear and concise to guide the summary generation effectively.

4. Save your changes and run the script as usual to fetch and summarize PRs using your updated prompt.

By customizing the detailed prompt, you can tailor the summaries to highlight specific aspects of your PRs, such as their impact, benefits, and key changes.

## Contributions

Contributions are welcome! Please feel free to submit a pull request or create an issue if you have any suggestions or find any bugs.


