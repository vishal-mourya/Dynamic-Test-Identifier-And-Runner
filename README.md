# AI-Based Dynamic Test Identifier & Runner

A powerful Chrome extension that analyzes code changes in Pull Requests, identifies relevant tests, and automatically triggers Jenkins pipelines to run targeted test suites with optimal coverage.

## 🚀 Features

### Core Functionality
- **Smart Test Detection**: Automatically identifies relevant test files based on code changes
- **Multi-Platform Support**: Works with GitHub, GitLab, and Bitbucket
- **Jenkins Integration**: Triggers automated test pipelines with custom parameters
- **Real-time Analysis**: Analyzes PR changes as you browse
- **Test Coverage Estimation**: Provides coverage metrics and suggestions
- **Automated Reporting**: Posts test results back to PR comments

### Advanced Features
- **Code Complexity Analysis**: Evaluates risk scores based on change complexity
- **Test Template Generation**: Creates test templates for new functions
- **Critical Code Highlighting**: Identifies high-risk code sections
- **Coverage Indicators**: Visual indicators for test coverage on files
- **Test Suggestions**: AI-powered recommendations for missing tests

## 📋 Prerequisites

Before installing the extension, ensure you have:

1. **Jenkins Server** with API access
2. **Git Platform Tokens**:
   - GitHub: Personal Access Token with `repo` scope
   - GitLab: Personal Access Token with `api` scope
   - Bitbucket: App Password with repository access
3. **Chrome Browser** (version 88 or higher)

## 🔧 Installation

### Method 1: Developer Mode (Recommended for Development)

1. **Clone or Download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the extension directory
5. **Pin the extension** to your toolbar for easy access

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## ⚙️ Configuration

### Initial Setup

1. **Click the extension icon** in your Chrome toolbar
2. **Navigate to the Config tab**
3. **Configure Jenkins Settings**:
   ```
   Jenkins URL: https://your-jenkins-server.com
   Username: your-jenkins-username
   API Token: your-jenkins-api-token
   Job Name: test-runner-pipeline (or your custom job name)
   ```

4. **Add Git Platform Tokens**:
   - **GitHub**: Add your Personal Access Token
   - **GitLab**: Add your Personal Access Token
   - **Bitbucket**: Add Username and App Password

5. **Configure Test Settings**:
   - Coverage Threshold: 80% (recommended)
   - Max Tests to Run: 50 (adjust based on your needs)
   - Auto-trigger: Enable for automatic test detection

6. **Click "Save Configuration"**

### Jenkins Pipeline Setup

Create a Jenkins pipeline job with the following parameters:

```groovy
pipeline {
    agent any
    
    parameters {
        string(name: 'REPO_URL', description: 'Repository URL')
        string(name: 'PR_NUMBER', description: 'Pull Request Number')
        string(name: 'TEST_FILES', description: 'Comma-separated test files')
        string(name: 'BRANCH', description: 'Branch to test')
    }
    
    stages {
        stage('Checkout') {
            steps {
                git url: "${params.REPO_URL}", branch: "${params.BRANCH}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // Add your dependency installation commands
                sh 'npm install' // or pip install, mvn install, etc.
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    def testFiles = params.TEST_FILES.split(',')
                    for (testFile in testFiles) {
                        // Run individual test files
                        sh "npm test ${testFile}" // Adjust for your test runner
                    }
                }
            }
        }
        
        stage('Generate Report') {
            steps {
                // Generate test reports
                publishTestResults testResultsPattern: 'test-results.xml'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'coverage',
                    reportFiles: 'index.html',
                    reportName: 'Coverage Report'
                ])
            }
        }
    }
    
    post {
        always {
            // Archive artifacts
            archiveArtifacts artifacts: 'test-results.xml,coverage/**/*', fingerprint: true
        }
    }
}
```

## 🎯 Usage

### Automatic Mode

1. **Navigate to a Pull Request** on GitHub, GitLab, or Bitbucket
2. **The extension automatically detects** the PR and shows a floating action button
3. **Click the analyze button** or wait for auto-trigger (if enabled)
4. **View results** in the side panel that appears
5. **Trigger tests** by clicking the "Trigger Tests" button
6. **Monitor progress** through the Jenkins build link
7. **Check results** posted automatically as PR comments

### Manual Mode

1. **Click the extension icon** in your toolbar
2. **Navigate to Dashboard tab**
3. **Click "Analyze Current PR"** while on a PR page
4. **Configure settings** in the Config tab as needed
5. **View history** in the History tab

### Features in Action

#### Smart Test Detection
- Analyzes changed files and identifies related test files
- Uses pattern matching and directory structure analysis
- Provides confidence scores for each identified test
- Supports multiple programming languages and frameworks

#### Code Analysis
- Detects function definitions and modifications
- Estimates complexity and risk scores
- Highlights critical code sections
- Suggests test templates for new functions

#### Jenkins Integration
- Automatically triggers parameterized builds
- Passes repository URL, PR number, and test file list
- Monitors build progress and status
- Reports results back to the PR

## 🔍 Supported Platforms

### Git Platforms
- **GitHub**: Full support for public and private repositories
- **GitLab**: Support for GitLab.com and self-hosted instances
- **Bitbucket**: Support for Bitbucket Cloud

### Programming Languages
- **JavaScript/TypeScript**: Jest, Mocha, Jasmine test patterns
- **Python**: pytest, unittest patterns
- **Java**: JUnit, TestNG patterns
- **C#**: NUnit, MSTest patterns
- **Go**: Built-in testing package patterns
- **PHP**: PHPUnit patterns

### Test Frameworks
The extension recognizes common test file patterns:
- `*.test.js`, `*.spec.js`
- `*Test.java`, `*Tests.java`
- `test_*.py`, `*_test.py`
- `*.Test.cs`, `*.Tests.cs`
- `*_test.go`
- `*Test.php`

## 🛠️ Development

### Project Structure
```
ai-based-dynamic-test-identifier-runner/
├── manifest.json           # Extension manifest
├── background.js           # Service worker for API calls
├── content.js             # Content script for PR analysis
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styles
├── styles.css             # Content script styles
├── injected.js            # Enhanced PR page functionality
├── icons/                 # Extension icons
├── create-icons.js        # Icon generation utility
└── README.md             # This file
```

### Building from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner.git
   cd ai-based-dynamic-test-identifier-runner
   ```

2. **Generate icons** (optional):
   ```bash
   node create-icons.js
   ```

3. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the project directory

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 🔒 Security & Privacy

### Data Handling
- **No data collection**: The extension doesn't collect or store personal data
- **Local storage only**: Configuration stored locally in Chrome
- **Secure API calls**: All API communications use HTTPS
- **Token security**: API tokens stored securely in Chrome's encrypted storage

### Permissions
The extension requires the following permissions:
- `activeTab`: To analyze current PR pages
- `storage`: To save configuration settings
- `scripting`: To inject analysis scripts
- `webRequest`: To monitor API calls
- Host permissions for Git platforms and Jenkins

## 🐛 Troubleshooting

### Common Issues

#### Extension Not Working on PR Pages
- **Check URL patterns**: Ensure you're on a supported PR URL
- **Refresh the page**: Sometimes a page refresh is needed
- **Check console**: Open DevTools and check for JavaScript errors

#### Jenkins Connection Failed
- **Verify credentials**: Test Jenkins URL, username, and token
- **Check CORS settings**: Jenkins may need CORS configuration
- **Firewall issues**: Ensure Jenkins is accessible from your network

#### Test Detection Not Working
- **Check file patterns**: Verify your test files match supported patterns
- **Repository structure**: Ensure the extension can access repository structure
- **API tokens**: Verify Git platform tokens have sufficient permissions

#### No Test Results Posted
- **Check PR permissions**: Ensure token has write access to repository
- **Jenkins job status**: Verify the Jenkins job completed successfully
- **API rate limits**: Check if you've hit API rate limits

### Debug Mode

Enable debug mode by:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for "Dynamic Test Runner" log messages
4. Check Network tab for API call failures

### Support

For additional support:
- **GitHub Issues**: [Report bugs or request features](https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner/issues)
- **Documentation**: [Wiki pages](https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner/wiki)
- **Community**: [Discussions](https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner/discussions)

## 📊 Metrics & Analytics

The extension tracks local usage metrics:
- Number of tests run per day
- Success rate of test executions
- Average test runtime
- Most frequently tested repositories

All metrics are stored locally and never transmitted.

## 🔄 Updates

The extension automatically checks for updates when:
- Chrome starts
- Extension is enabled/disabled
- Every 24 hours

To manually check for updates:
1. Go to `chrome://extensions/`
2. Click "Update" button
3. Restart Chrome if prompted

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chrome Extension APIs**: For providing the platform
- **Jenkins**: For the CI/CD integration capabilities
- **Git Platforms**: GitHub, GitLab, and Bitbucket for their APIs
- **Open Source Community**: For inspiration and best practices

## 🚀 Roadmap

### Upcoming Features
- [ ] **AI-Powered Test Generation**: Use machine learning to generate more accurate tests
- [ ] **Integration with More CI/CD Tools**: Support for GitHub Actions, GitLab CI, etc.
- [ ] **Advanced Coverage Analysis**: Integration with coverage tools like SonarQube
- [ ] **Team Analytics**: Shared metrics and insights for development teams
- [ ] **Custom Test Patterns**: User-defined test file patterns
- [ ] **Slack/Teams Integration**: Notifications to team channels

### Version History
- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Enhanced UI and better error handling (planned)
- **v1.2.0**: AI-powered test suggestions (planned)

---

**Made with ❤️ for developers who care about testing**
