# Deployment Guide - AI-Based Dynamic Test Identifier & Runner

This guide provides step-by-step instructions for deploying and using the AI-Based Dynamic Test Identifier & Runner Chrome extension.

## 📋 Pre-Deployment Checklist

### System Requirements
- ✅ Google Chrome 88+ or Chromium-based browser
- ✅ Node.js 14+ (for development and validation)
- ✅ Jenkins server with API access
- ✅ Git platform access (GitHub, GitLab, or Bitbucket)

### Required Credentials
- ✅ Jenkins URL, username, and API token
- ✅ Git platform personal access tokens
- ✅ Repository access permissions

## 🚀 Installation Methods

### Method 1: Developer Mode (Recommended)

1. **Download/Clone the Extension**
   ```bash
   git clone https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner.git
   cd ai-based-dynamic-test-identifier-runner
   ```

2. **Run Setup Script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the extension directory
   - Pin the extension to your toolbar

### Method 2: Manual Installation

1. **Validate Extension**
   ```bash
   node validate-manifest.js
   node test-extension.js
   ```

2. **Generate Icons**
   ```bash
   node create-icons.js
   ```

3. **Load Extension**
   - Follow steps 3 from Method 1

## ⚙️ Configuration Setup

### 1. Jenkins Configuration

1. **Open Extension Popup**
   - Click the extension icon in Chrome toolbar
   - Navigate to "Config" tab

2. **Configure Jenkins Settings**
   ```
   Jenkins URL: https://your-jenkins-server.com
   Username: your-jenkins-username
   API Token: your-jenkins-api-token
   Job Name: test-runner-pipeline
   ```

3. **Create Jenkins Pipeline Job**
   - Copy content from `jenkins-pipeline-example.groovy`
   - Create new Pipeline job in Jenkins
   - Configure with required parameters:
     - REPO_URL (String)
     - PR_NUMBER (String)
     - TEST_FILES (String)
     - BRANCH (String)
     - COVERAGE_THRESHOLD (String)

### 2. Git Platform Tokens

#### GitHub Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
3. Add token to extension config

#### GitLab Setup
1. Go to GitLab User Settings → Access Tokens
2. Create token with scopes:
   - `api` (Access the authenticated user's API)
   - `read_repository` (Read repository)
3. Add token to extension config

#### Bitbucket Setup
1. Go to Bitbucket Account Settings → App passwords
2. Create app password with permissions:
   - Repositories: Read
   - Pull requests: Read
3. Add username and app password to extension config

### 3. Test Configuration

1. **Click "Test Connection"** in the Config tab
2. **Verify Jenkins connectivity**
3. **Save configuration**

## 🎯 Usage Instructions

### Automatic Mode

1. **Navigate to a Pull Request**
   - Open any PR on GitHub, GitLab, or Bitbucket
   - Extension automatically detects the PR

2. **Analyze Tests**
   - Click the floating action button (⚡) that appears
   - Or use the extension popup → "Analyze Current PR"

3. **Review Results**
   - View identified test files in the side panel
   - Check coverage analysis and risk assessment
   - Review suggested tests

4. **Trigger Pipeline**
   - Click "Trigger Tests" to start Jenkins pipeline
   - Monitor progress via Jenkins link
   - Results will be posted to PR automatically

### Manual Mode

1. **Use Extension Popup**
   - Click extension icon in toolbar
   - Use "Analyze Current PR" button
   - Configure settings as needed

2. **View History**
   - Check previous test runs in History tab
   - Review success rates and metrics

## 🔧 Advanced Configuration

### Custom Test Patterns

Edit `config.json` to add custom test file patterns:

```json
{
  "testPatterns": {
    "your-language": {
      "extensions": ["ext1", "ext2"],
      "patterns": ["**/*_test.ext1", "**/test/**/*.ext1"],
      "frameworks": ["your-framework"]
    }
  }
}
```

### Jenkins Pipeline Customization

Modify `jenkins-pipeline-example.groovy` for your specific needs:

- Add custom build steps
- Configure different test runners
- Set up notifications
- Add quality gates

### Environment Variables

Set these in your Jenkins pipeline:

```groovy
environment {
    NODE_VERSION = '18'
    COVERAGE_THRESHOLD = '80'
    TEST_TIMEOUT = '30'
}
```

## 🐛 Troubleshooting

### Common Issues

#### Extension Not Loading
- **Check manifest validation**: `node validate-manifest.js`
- **Verify file permissions**: Ensure all files are readable
- **Check Chrome version**: Requires Chrome 88+

#### Jenkins Connection Failed
- **Verify credentials**: Test Jenkins URL, username, token
- **Check CORS settings**: Jenkins may need CORS configuration
- **Network access**: Ensure Jenkins is accessible from browser

#### Test Detection Not Working
- **Check repository access**: Verify Git platform tokens
- **Review test patterns**: Ensure patterns match your test files
- **API rate limits**: Check if you've exceeded API limits

#### No Results Posted to PR
- **Check permissions**: Token needs write access to repository
- **Verify Jenkins job**: Ensure pipeline completes successfully
- **API errors**: Check browser console for error messages

### Debug Mode

1. **Open Chrome DevTools** (F12)
2. **Check Console tab** for error messages
3. **Monitor Network tab** for failed API calls
4. **Inspect Extension** via `chrome://extensions/`

### Log Files

Check these locations for logs:
- Chrome DevTools Console
- Jenkins build logs
- Extension background page console

## 📊 Monitoring & Analytics

### Built-in Metrics

The extension tracks:
- Tests run per day
- Success rate
- Average runtime
- Most tested repositories

### Custom Analytics

Extend the extension to track:
- Team usage patterns
- Test effectiveness
- Coverage improvements
- Time savings

## 🔒 Security Considerations

### Best Practices

1. **Token Security**
   - Use tokens with minimal required permissions
   - Rotate tokens regularly
   - Never commit tokens to version control

2. **Network Security**
   - Use HTTPS for all API calls
   - Validate SSL certificates
   - Implement proper error handling

3. **Data Privacy**
   - Extension stores data locally only
   - No data transmitted to third parties
   - Clear sensitive data on uninstall

### Security Audit

Run security checks:
```bash
node test-extension.js  # Includes security tests
```

## 🚀 Production Deployment

### For Teams

1. **Package Extension**
   ```bash
   npm run zip
   ```

2. **Distribute via Chrome Web Store**
   - Create developer account
   - Upload extension package
   - Submit for review

3. **Enterprise Deployment**
   - Use Chrome Enterprise policies
   - Deploy via Group Policy
   - Configure default settings

### Scaling Considerations

- **Jenkins Resources**: Ensure adequate build capacity
- **API Rate Limits**: Monitor Git platform API usage
- **Network Bandwidth**: Consider impact of concurrent usage

## 📈 Updates & Maintenance

### Regular Maintenance

1. **Update Dependencies**
   ```bash
   npm update
   ```

2. **Test Extension**
   ```bash
   node test-extension.js
   ```

3. **Monitor Performance**
   - Check extension size
   - Monitor API response times
   - Review error rates

### Version Updates

1. **Update manifest.json version**
2. **Test thoroughly**
3. **Update documentation**
4. **Deploy to users**

## 📞 Support

### Getting Help

- **Documentation**: Check README.md and wiki
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join discussions forum
- **Enterprise**: Contact support team

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

---

**🎉 Congratulations! Your AI-Based Dynamic Test Identifier & Runner is now ready for production use.**

For additional support, please refer to the main README.md or contact the development team.
