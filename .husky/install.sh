#!/usr/bin/env sh

# Husky install script for UI/UX pre-commit hooks

echo "🔧 Setting up Husky pre-commit hooks..."

# Check if husky is installed
if ! command -v husky &> /dev/null; then
  echo "📦 Installing husky..."
  npm install --save-dev husky
fi

# Initialize husky
npx husky install

# Make pre-commit executable
chmod +x .husky/pre-commit

echo "✅ Husky pre-commit hooks installed!"
echo ""
echo "Pre-commit hook will run:"
echo "  - UI/UX analysis (pre-commit profile)"
echo "  - Auto-fix for critical design token violations"
echo "  - Block commits with critical accessibility issues"
echo ""
echo "To bypass: git commit --no-verify"
