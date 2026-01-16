# 🚀 AUTO-DEPLOY SCRIPT - GitHub Pages

## This script automates deployment to GitHub Pages

echo "🚀 AI-POS Auto-Deploy Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository exists"
fi

# Add all files
echo "📝 Adding all files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy: AI-POS v3.0 - Production Ready with Cloud Sync"

# Ask for GitHub username
echo ""
echo "🔑 GitHub Setup Required:"
echo "=========================="
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Ask for repository name
echo ""
read -p "Enter repository name (default: ai-pos-app): " REPO_NAME
REPO_NAME=${REPO_NAME:-ai-pos-app}

# Add remote
echo ""
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Create .nojekyll file for GitHub Pages
echo "📄 Creating .nojekyll file..."
touch .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll for GitHub Pages" 2>/dev/null

echo ""
echo "================================"
echo "🎯 Ready to Push!"
echo "================================"
echo ""
echo "NEXT STEPS:"
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Keep it PUBLIC"
echo "4. Don't initialize with any files"
echo "5. Click 'Create repository'"
echo ""
echo "Then run:"
echo "  git push -u origin main"
echo ""
echo "After pushing, enable GitHub Pages:"
echo "1. Go to repository Settings"
echo "2. Pages (left sidebar)"
echo "3. Source: main branch"
echo "4. Folder: / (root)"
echo "5. Save"
echo ""
echo "Your app will be live at:"
echo "https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
