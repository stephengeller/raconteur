# PR Hypedocifier

PR Hypedocifier is a tool designed to summarize merged pull requests for a given GitHub user, emphasizing the impact and benefits of each PR. It uses the GitHub and OpenAI APIs to fetch PR information and generate concise summaries.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v12 or later recommended)
- yarn (usually comes with Node.js)
- jq (command-line JSON processor)

## Setup

### **Clone the repository and install dependencies**
```bash
git clone https://github.com/stephengeller/pull-request-hypedoc
cd pull-request-hypedoc
yarn install
```

### **Environment Configuration**

Secure handling of sensitive information such as GitHub tokens and OpenAI API keys is managed through a .env file.

- Generate a new Personal Access Token (PAT) from GitHub with `repo` scope.
- Obtain an API key from platform.openai.com/api-keys (SSO with your squareup account)
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

## Contributions

Contributions are welcome! Please feel free to submit a pull request or create an issue if you have any suggestions or find any bugs.


