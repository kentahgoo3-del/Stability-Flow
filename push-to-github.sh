#!/bin/bash
echo "Creating clean branch..."
git checkout --orphan tmp-push
git rm -r --cached attached_assets/ 2>/dev/null
git add .
git commit -m "fix: use public logo, include dev deps in build"
echo ""
echo "Pushing to GitHub..."
git push https://github.com/kentahgoo3-del/Stability-Flow.git tmp-push:main --force
echo ""
echo "Cleaning up..."
git checkout main 2>/dev/null || true
git branch -D tmp-push 2>/dev/null || true
echo "Done! Check GitHub."
