# Raconteur
[Setup](#setup) | [Usage](#usage) | [Contributions](#contributions)

Raconteur is a project comprised of a few tools:
1. **PR Hypedocifier**, designed to summarize merged pull requests for a given GitHub user, emphasizing the impact and benefits of each PR. 
2. **PR Description Generator**, a utility to create detailed descriptions for your pull requests using OpenAI's GPT models. Both tools leverage the GitHub and OpenAI APIs to fetch PR information and generate concise summaries or detailed descriptions.
3. **Commit Message Generator**, a tool to generate commit messages based on the changes made in a commit.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v12 or later recommended)
- yarn (usually comes with Node.js)
- jq (command-line JSON processor)

## Setup

### Automated Setup

To simplify the initial setup process, use the setup script that guides you through installing dependencies, generating necessary tokens, and configuring your `.env` file for both PR Hypedocifier and PR Description Generator.

```bash
./script/setup
```

### Manual Setup

Follow the prompts and instructions in the terminal to complete your setup.

#### **Clone the repository and install dependencies**
```bash
git clone https://github.com/stephengeller/raconteur
cd raconteur
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
SQUAREUP_EMAIL=your_openai_email_here
JIRA_API_TOKEN=your_jira_api_token_here
````
  Replace `your_github_token_here` and `your_openai_api_key_here` with your actual GitHub token and OpenAI API key.

## **Usage**
### PR Hypedocifier
To run the PR Hypedocifier summarizer:
```bash
yarn start
```

This will fetch merged PRs, generate summaries, and copy the latest summary to your clipboard.

#### Customizing the Detailed Prompt

When you run the PR Description Generator and choose to write a custom prompt, your prompt is saved automatically. The next time you use the generator, it will reuse your saved prompt, simplifying the process for consistent use.

## **PR Description Generator**
The PR Description Generator allows you to create detailed PR descriptions from within any git repository.

### Setting up the Alias
For convenience, you can set up an alias to use the PR Description Generator from any directory:
```bash
alias prdesc='CURRENT_DIR=$(pwd) yarn --cwd ~/path/to/raconteur run prdesc'
```

Replace `~/path/to/raconteur` with the actual path to the raconteur repository on your system. Add this alias to your` ~/.bashrc`, `~/.zshrc`, or equivalent shell configuration file and source it.

Running the PR Description Generator
Navigate to the directory of the repository you wish to generate a PR description for, and run:
```bash
prdesc
```

Follow the interactive prompts to customize and generate your PR description.

## Contributions

Contributions are welcome! Please feel free to submit a pull request or create an issue if you have any suggestions or find any bugs.
