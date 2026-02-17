#!/bin/bash
# ===========================================
# Fix Git Repository Structure
# ===========================================
# PROBLEM: The .git directory is at your home folder (~),
#          making the entire home dir a git repo.
#          When cloned, the project ends up nested as:
#          Desktop/Twin-main/Desktop/Twin-main/apps/...
#
# FIX: Re-initialize git at the correct project root
#      and force-push to GitHub.
#
# This is SAFE — it preserves all your files.
# Only the git history gets reset (11 commits).
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Fix Git Repository Structure          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# This script must be run from the monorepo root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo -e "${YELLOW}Current situation:${NC}"
echo "  Git root:     $(git rev-parse --show-toplevel 2>/dev/null || echo 'N/A')"
echo "  Project root: $PROJECT_ROOT"
echo "  Remote:       $(git remote get-url origin 2>/dev/null || echo 'N/A')"
echo ""

# Verify we're in the right place
if [ ! -f "$PROJECT_ROOT/package.json" ] || [ ! -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]; then
  echo -e "${RED}❌ This doesn't look like the monorepo root. Aborting.${NC}"
  exit 1
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

echo -e "${YELLOW}This will:${NC}"
echo "  1. Remove the .git from your home directory"
echo "  2. Initialize a fresh git repo HERE ($PROJECT_ROOT)"
echo "  3. Commit all files"
echo "  4. Force-push to: $REMOTE_URL (branch: $BRANCH)"
echo ""
echo -e "${RED}⚠️  This resets git history (11 commits). Your files are NOT affected.${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Step 1: Remove old .git from home directory
OLD_GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -d "$OLD_GIT_ROOT/.git" ] && [ "$OLD_GIT_ROOT" != "$PROJECT_ROOT" ]; then
  echo ""
  echo "🗑️  Removing old .git from $OLD_GIT_ROOT..."
  rm -rf "$OLD_GIT_ROOT/.git"
  echo -e "  ${GREEN}✓ Removed${NC}"
fi

# Step 2: Initialize fresh git repo
echo "🆕 Initializing git in $PROJECT_ROOT..."
cd "$PROJECT_ROOT"
git init
git branch -M "$BRANCH"
echo -e "  ${GREEN}✓ Git initialized${NC}"

# Step 3: Add remote
if [ -n "$REMOTE_URL" ]; then
  echo "🔗 Adding remote: $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
  echo -e "  ${GREEN}✓ Remote added${NC}"
fi

# Step 4: Stage all files
echo "📂 Staging files..."
git add -A
echo -e "  ${GREEN}✓ Files staged${NC}"

# Show what's being committed
echo ""
echo "Files to commit:"
git diff --cached --stat | tail -5
echo ""

# Step 5: Commit
echo "💾 Committing..."
git commit -m "chore: restructure repo — clean monorepo root

Fixes nested Desktop/Twin-main structure.
Includes: API, worker, web app, mobile app, diarization service.
Co-authored-by: Cursor AI"
echo -e "  ${GREEN}✓ Committed${NC}"

# Step 6: Force push
if [ -n "$REMOTE_URL" ]; then
  echo ""
  echo -e "${YELLOW}Ready to force-push to $REMOTE_URL (branch: $BRANCH)${NC}"
  read -p "Force push now? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin "$BRANCH" --force
    echo -e "  ${GREEN}✓ Pushed!${NC}"
  else
    echo -e "  ${YELLOW}Skipped. Push manually with: git push -u origin $BRANCH --force${NC}"
  fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Git Fixed!                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Your co-founders can now clone with:"
echo -e "  ${CYAN}git clone $REMOTE_URL${NC}"
echo -e "  ${CYAN}cd Twin${NC}"
echo -e "  ${CYAN}./setup.sh${NC}"
echo ""
