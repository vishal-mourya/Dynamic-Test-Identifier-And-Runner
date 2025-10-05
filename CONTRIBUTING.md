# Contributing to AI-Based Dynamic Test Identifier & Runner

Thank you for your interest in contributing to AI-Based Dynamic Test Identifier & Runner! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and considerate in all interactions.

## Getting Started

1. **Fork the repository** to your own GitHub account
2. **Clone your fork** to your local machine
3. **Create a new branch** for your changes
4. **Make your changes** and test them thoroughly
5. **Submit a pull request** with a clear description of your changes

## How to Contribute

There are many ways to contribute to this project:

- **Report bugs**: If you find a bug, please open an issue with details
- **Suggest features**: Have an idea? Open an issue to discuss it
- **Improve documentation**: Help make our docs clearer and more comprehensive
- **Fix bugs**: Look for issues labeled "bug" and submit a fix
- **Add features**: Look for issues labeled "enhancement" or "feature request"
- **Write tests**: Help improve test coverage
- **Review pull requests**: Provide feedback on other contributors' work

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- Chrome browser (v88 or higher)
- Git

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/vishal-mourya/ai-based-dynamic-test-identifier-runner.git
   cd ai-based-dynamic-test-identifier-runner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate icons (if needed):
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

5. Make your changes and test them

### Project Structure

```
.
├── manifest.json           # Extension manifest
├── background.js           # Service worker for API calls
├── content.js             # Content script for PR analysis
├── injected.js            # Injected script for enhanced functionality
├── popup.html/js/css      # Extension popup interface
├── styles.css             # Content script styles
├── config.json            # Configuration defaults
├── icons/                 # Extension icons
└── docs/                  # Documentation files
```

## Coding Standards

### JavaScript Style

- Use ES6+ features where appropriate
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid global variables

### Example:

```javascript
// Good
async function analyzeCodeChanges(prData) {
  const changedFiles = await fetchChangedFiles(prData);
  return changedFiles.map(file => analyzeFile(file));
}

// Avoid
function x(d) {
  var f = get(d);
  return f.map(y => z(y));
}
```

### HTML/CSS

- Use semantic HTML5 elements
- Keep CSS organized and commented
- Use consistent class naming conventions
- Ensure responsive design principles

## Commit Guidelines

### Commit Message Format

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(analysis): add support for Rust test files

Added pattern matching for Rust test files and updated
the configuration to include Rust in supported languages.

Closes #123
```

```
fix(jenkins): resolve timeout issue in API calls

Increased timeout from 5s to 10s and added retry logic
for failed API calls.

Fixes #456
```

## Pull Request Process

1. **Update your fork** with the latest changes from the main repository:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Test your changes** thoroughly:
   - Load the extension in Chrome
   - Test on different PR pages (GitHub, GitLab, Bitbucket)
   - Check the browser console for errors
   - Verify all features work as expected

3. **Create a pull request**:
   - Use a clear and descriptive title
   - Reference any related issues
   - Describe your changes in detail
   - Include screenshots/GIFs if applicable
   - List any breaking changes

4. **Respond to feedback**:
   - Be open to suggestions
   - Make requested changes promptly
   - Keep the discussion constructive

5. **Wait for approval**:
   - At least one maintainer must approve
   - All CI checks must pass
   - Conflicts must be resolved

## Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to recreate the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**:
   - Chrome version
   - Operating system
   - Extension version
6. **Screenshots**: If applicable
7. **Console errors**: Any errors from the browser console

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- Chrome Version: [e.g., 120.0.6099.109]
- OS: [e.g., Windows 11, macOS 14]
- Extension Version: [e.g., 1.0.0]

**Screenshots**
If applicable, add screenshots.

**Console Errors**
```
Any console errors
```
```

## Suggesting Features

When suggesting features, please include:

1. **Use case**: Why is this feature needed?
2. **Description**: Clear description of the feature
3. **Benefits**: How would this help users?
4. **Alternatives**: Any alternative solutions you've considered
5. **Additional context**: Mockups, examples, etc.

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context, mockups, or screenshots.
```

## Testing

Before submitting a pull request:

1. **Manual testing**:
   - Test on multiple PR pages
   - Test all major features
   - Test error scenarios
   - Test on different screen sizes

2. **Code quality**:
   - No console errors
   - No linting errors
   - Code follows project standards
   - Comments added where needed

3. **Documentation**:
   - Update README if needed
   - Update inline documentation
   - Add/update JSDoc comments

## Questions?

If you have questions:

- Check the [README](README.md) and other documentation
- Search existing issues
- Open a new issue with the "question" label
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI-Based Dynamic Test Identifier & Runner! 🎉
