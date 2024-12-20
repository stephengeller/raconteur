# Raconteur

[Setup](#setup) | [Usage](#usage) | [Development](#development) | [Testing](#testing) | [Troubleshooting](#troubleshooting) | [Contributions](#contributions)

Raconteur is a dynamic project that empowers developers with three core tools:

1. **Raconteur**: This tool summarizes merged pull requests for a given GitHub user, emphasizing the
   impact and benefits of each PR. It utilizes prompts to structure these summaries effectively,
   ensuring they are both clear and concise for future reference in your documentation.

2. **PR Description Generator**: Leveraging OpenAI's GPT models, this utility crafts comprehensive
   and detailed descriptions for pull requests. It taps into the power of the OpenAI and GitHub APIs
   to gather PR information and generate robust narratives that articulate the essence and necessity
   of the changes.

3. **Commit Message Generator**: This component automates the creation of commit messages, following
   the Conventional Commits specification. By analyzing the changes made in a commit, it formulates
   a message that succinctly captures the essence of the modifications, ensuring consistency and
   clarity in version control histories.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v12 or later)
- yarn (package manager)
- jq (command-line JSON processor)
- Git

## Setup

### Quick Setup (Recommended)

The project includes an automated setup script that handles all necessary configurations:

```bash
# Clone the repository
git clone https://github.com/stephengeller/raconteur
cd raconteur

# Run the setup script
./script/setup
```

The setup script will:

1. Install all required dependencies
2. Guide you through generating necessary API tokens
3. Create and configure your `.env` file
4. Verify your installation

### Manual Setup

If you prefer to set up manually:

1. **Install Dependencies**

```bash
yarn install
```

2. **Configure Environment Variables**
   Create a `.env` file in the project root with the following:

```bash
GITHUB_TOKEN=your_github_token_here        # From https://github.com/settings/tokens (needs 'repo' scope)
OPENAI_API_KEY=your_openai_api_key_here    # From https://platform.openai.com/api-keys
GITHUB_USERNAME=your_github_username_here
SQUAREUP_EMAIL=your_openai_email_here
JIRA_API_TOKEN=your_jira_api_token_here
```

## Project Structure

```
raconteur/
├── src/                          # Source code
│   ├── prDescriptionGenerator/   # PR Description Generator implementation
│   ├── CommitMessageGenerator/   # Commit Message Generator implementation
│   └── index.ts                 # Main entry point
├── script/                       # Setup and utility scripts
├── test/                        # Test files
├── hypedoc_processing/          # Performance review entry processing scripts
│   ├── process_entries.py       # Main script for cleaning and organizing entries
│   ├── generate_quarterly_narratives.py # Generate narrative summaries
│   └── markdown_converter_fixed.py # Convert entries to markdown format
└── package.json                 # Project configuration
```

## Development

### Available Commands

```bash
# Install dependencies
yarn install

# Run the PR Hypedocifier summarizer
yarn start

# Generate PR descriptions
yarn prdesc

# Generate commit messages
yarn commit

# Run tests
yarn test
```

## Testing

The project uses Jest for testing. Test files are co-located with their source files using the
naming convention `*.test.ts`.

To run tests:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## Troubleshooting

### Common Issues

1. **GitHub Authentication Fails**
   ```bash
   # Run GitHub authentication
   gh auth login
   ```

2. **Jira Integration Issues**
   ```bash
   # Initialize Jira CLI
   jira init
   ```

3. **Missing Dependencies**
   ```bash
   # Reinstall dependencies
   yarn install
   ```

4. **Environment Variables**
    - Ensure all required environment variables are set in `.env`
    - Check that API tokens have the correct permissions
    - Verify there are no trailing spaces in `.env` values

### Debug Tips

1. Check your environment configuration:
   ```bash
   # Verify environment variables (excluding sensitive values)
   grep -v '_KEY\|_TOKEN' .env
   ```

2. Verify GitHub authentication:
   ```bash
   gh auth status
   ```

3. Test Jira connection:
   ```bash
   jira issue list -l 1
   ```

## Contributions

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`yarn test`)
5. Submit a pull request

When creating PRs:

1. Use the PR Description Generator (`yarn prdesc`)
2. Ensure all tests pass
3. Include relevant Jira ticket references
4. Update documentation if needed

For major changes, please open an issue first to discuss what you would like to change.