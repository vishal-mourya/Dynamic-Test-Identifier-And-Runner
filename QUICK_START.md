# 🚀 Quick Start Guide - AI-Based Dynamic Test Identifier & Runner

Get up and running with the AI-Based Dynamic Test Identifier & Runner Chrome extension in just 5 minutes!

## ⚡ 5-Minute Setup

### Step 1: Install Extension (2 minutes)
```bash
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode" (top-right toggle)
# 3. Click "Load unpacked"
# 4. Select this directory
# 5. Pin extension to toolbar
```

### Step 2: Basic Configuration (2 minutes)
1. **Click extension icon** → Go to "Config" tab
2. **Add Jenkins details**:
   - URL: `https://your-jenkins-server.com`
   - Username: `your-username`
   - Token: `your-api-token`
3. **Add Git token** (choose one):
   - GitHub: Personal Access Token
   - GitLab: Personal Access Token  
   - Bitbucket: Username + App Password
4. **Click "Save Configuration"**

### Step 3: Test It Out (1 minute)
1. **Open any Pull Request** on GitHub/GitLab/Bitbucket
2. **Click the ⚡ button** that appears on the PR page
3. **View results** in the side panel
4. **Click "Trigger Tests"** to run Jenkins pipeline

## 🎯 Essential Features

### 🔍 Smart Test Detection
- Automatically finds relevant test files
- Analyzes code changes and dependencies
- Provides confidence scores for each test

### 🚀 One-Click Testing
- Triggers Jenkins pipelines automatically
- Passes test files and PR context
- Posts results back to PR

### 📊 Coverage Analysis
- Estimates test coverage
- Identifies critical code sections
- Suggests missing tests

## 🛠️ Jenkins Pipeline Setup

Create a Jenkins job with these parameters:
- `REPO_URL` (String)
- `PR_NUMBER` (String) 
- `TEST_FILES` (String)
- `BRANCH` (String)

Use the provided `jenkins-pipeline-example.groovy` as a template.

## 🔧 Common Configurations

### GitHub + Jenkins
```json
{
  "jenkins": {
    "url": "https://jenkins.company.com",
    "username": "ci-user",
    "token": "your-jenkins-token"
  },
  "github": {
    "token": "ghp_your-github-token"
  }
}
```

### GitLab + Jenkins
```json
{
  "jenkins": {
    "url": "https://jenkins.company.com", 
    "username": "ci-user",
    "token": "your-jenkins-token"
  },
  "gitlab": {
    "token": "glpat-your-gitlab-token"
  }
}
```

## 🎨 How It Works

1. **Detection**: Extension detects when you're on a PR page
2. **Analysis**: Analyzes changed files and identifies related tests
3. **Recommendation**: Shows relevant tests with confidence scores
4. **Execution**: Triggers Jenkins pipeline with selected tests
5. **Reporting**: Posts results back to PR automatically

## 🔍 Supported Platforms

### Git Platforms
- ✅ GitHub (github.com)
- ✅ GitLab (gitlab.com)
- ✅ Bitbucket (bitbucket.org)

### Languages & Frameworks
- ✅ JavaScript/TypeScript (Jest, Mocha, Vitest)
- ✅ Python (pytest, unittest)
- ✅ Java (JUnit, TestNG)
- ✅ C# (NUnit, MSTest, xUnit)
- ✅ Go (built-in testing)
- ✅ PHP (PHPUnit)
- ✅ And more...

## 🐛 Quick Troubleshooting

### Extension not working?
- Check if you're on a supported PR URL
- Refresh the page
- Check browser console (F12) for errors

### Jenkins connection failed?
- Verify Jenkins URL is accessible
- Check username and token are correct
- Ensure Jenkins has CORS enabled if needed

### No tests detected?
- Check if your test files match supported patterns
- Verify repository access permissions
- Review test file naming conventions

## 📚 Need More Help?

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Project Details**: See `PROJECT_SUMMARY.md`
- **Issues**: Check browser console and extension logs

## 🎉 You're Ready!

The extension is now configured and ready to use. Navigate to any Pull Request and start analyzing tests automatically!

### Pro Tips:
- 💡 Pin the extension to your toolbar for easy access
- 💡 Use auto-trigger for seamless workflow
- 💡 Check the History tab to track your testing patterns
- 💡 Customize test patterns in `config.json` for your specific needs

---

**Happy Testing! 🚀**
