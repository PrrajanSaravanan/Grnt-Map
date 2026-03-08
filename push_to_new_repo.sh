#!/bin/bash

# Check if a repository URL was provided
if [ -z "$1" ]; then
  echo "Error: Please provide your new repository URL."
  echo "Usage: ./push_to_new_repo.sh <YOUR_NEW_REPO_URL>"
  echo "Example: ./push_to_new_repo.sh https://github.com/username/my-new-project.git"
  exit 1
fi

REPO_URL=$1

echo "Initializing new git repository..."

# Initialize git
git init

# Rename current branch to main
git branch -M main

# Add all files
echo "Adding files..."
git add .

# Commit
echo "Committing files..."
git commit -m "Initial commit from AI Studio export"

# Add the remote repository
echo "Adding remote origin: $REPO_URL"
git remote add origin "$REPO_URL"

# Push to the new repository
echo "Pushing to remote..."
git push -u origin main

echo "Done! Your code is now in $REPO_URL"
