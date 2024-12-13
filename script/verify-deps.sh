#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version meets minimum requirement
version_meets_minimum() {
    local current="$1"
    local required="$2"
    
    # Remove 'v' prefix if present
    current="${current#v}"
    required="${required#v}"
    
    # Compare versions
    if [ "$(printf '%s\n' "$required" "$current" | sort -V | head -n1)" = "$required" ]; then
        return 0 # Current version is greater or equal
    else
        return 1 # Current version is less
    fi
}

# Function to install package using Homebrew
install_with_brew() {
    local package="$1"
    if command_exists brew; then
        echo -e "${BLUE}Installing $package using Homebrew...${NC}"
        brew install "$package"
    else
        echo -e "${RED}Homebrew is not installed. Please install Homebrew first:${NC}"
        echo -e "${YELLOW}https://brew.sh${NC}"
        exit 1
    fi
}

# Check Node.js
echo -e "${BLUE}Checking Node.js installation...${NC}"
if command_exists node; then
    NODE_VERSION=$(node -v)
    if version_meets_minimum "${NODE_VERSION}" "v12.0.0"; then
        echo -e "${GREEN}Node.js ${NODE_VERSION} is installed and meets minimum requirements.${NC}"
    else
        echo -e "${RED}Node.js ${NODE_VERSION} is installed but does not meet minimum requirement (v12.0.0).${NC}"
        echo -e "${YELLOW}Please upgrade Node.js using nvm or your preferred method.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Node.js is not installed.${NC}"
    install_with_brew "node"
fi

# Check yarn
echo -e "\n${BLUE}Checking yarn installation...${NC}"
if command_exists yarn; then
    YARN_VERSION=$(yarn -v)
    echo -e "${GREEN}yarn ${YARN_VERSION} is installed.${NC}"
else
    echo -e "${RED}yarn is not installed.${NC}"
    echo -e "${BLUE}Installing yarn...${NC}"
    npm install -g yarn
fi

# Check jq
echo -e "\n${BLUE}Checking jq installation...${NC}"
if command_exists jq; then
    JQ_VERSION=$(jq --version)
    echo -e "${GREEN}${JQ_VERSION} is installed.${NC}"
else
    echo -e "${RED}jq is not installed.${NC}"
    install_with_brew "jq"
fi

# Check gh CLI
echo -e "\n${BLUE}Checking GitHub CLI installation...${NC}"
if command_exists gh; then
    GH_VERSION=$(gh --version | head -n 1)
    echo -e "${GREEN}${GH_VERSION} is installed.${NC}"
else
    echo -e "${RED}GitHub CLI is not installed.${NC}"
    install_with_brew "gh"
fi

# All checks passed
echo -e "\n${GREEN}All required dependencies are installed!${NC}"