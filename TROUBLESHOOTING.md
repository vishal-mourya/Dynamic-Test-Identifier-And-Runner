# 🔧 Troubleshooting Guide - Extension UI Not Loading

## Quick Diagnosis Steps

### Step 1: Check Extension Status
1. Open `chrome://extensions/`
2. Find "AI-Based Dynamic Test Identifier & Runner"
3. Check if it shows any errors in red text
4. If errors exist, note them down

### Step 2: Test with Simple Popup
1. **Backup current manifest**: `cp manifest.json manifest-backup.json`
2. **Use test manifest**: `cp manifest-test.json manifest.json`
3. **Reload extension** in `chrome://extensions/`
4. **Test popup** - if this works, the issue is in the main popup files

### Step 3: Check Browser Console
1. **Right-click extension icon** → "Inspect popup"
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** for failed resource loads

## Common Issues & Solutions

### Issue 1: Extension Icon Not Visible
**Symptoms**: Extension not showing in toolbar
**Solutions**:
```bash
# Check if extension is loaded
# Go to chrome://extensions/ and verify it's enabled

# Check manifest syntax
node validate-manifest.js

# Reload extension
# Click reload button in chrome://extensions/
```

### Issue 2: Popup Opens But Is Blank
**Symptoms**: Popup window opens but shows nothing
**Causes**:
- CSS file not loading
- JavaScript errors
- Missing files

**Solutions**:
```bash
# Check all files exist
ls -la popup.html popup.js popup.css

# Test with minimal popup
cp manifest-test.json manifest.json
# Reload extension and test
```

### Issue 3: JavaScript Errors
**Symptoms**: Console shows JS errors
**Common Errors & Fixes**:

```javascript
// Error: Cannot read property 'sendMessage' of undefined
// Fix: Check chrome.runtime is available
if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage(...);
}

// Error: Extension context invalidated
// Fix: Reload the extension

// Error: CSP violation
// Fix: Remove inline scripts, use external files only
```

### Issue 4: CSS Not Loading
**Symptoms**: Popup appears unstyled
**Solutions**:
```bash
# Check CSS file exists and has content
ls -la popup.css
head popup.css

# Verify CSS link in HTML
grep "popup.css" popup.html
```

### Issue 5: Permissions Issues
**Symptoms**: Chrome APIs not working
**Check manifest permissions**:
```json
{
  "permissions": [
    "activeTab",
    "storage", 
    "scripting",
    "tabs"
  ]
}
```

## Step-by-Step Debugging

### Debug Method 1: Use Test Popup
1. **Switch to test manifest**:
   ```bash
   cp manifest-test.json manifest.json
   ```
2. **Reload extension**
3. **Test popup** - should show simple interface
4. **If test popup works**: Issue is in main popup files
5. **If test popup fails**: Issue is with extension loading

### Debug Method 2: Check File Loading
1. **Open popup inspector**: Right-click extension icon → "Inspect popup"
2. **Go to Network tab**
3. **Click extension icon** to open popup
4. **Check for failed requests** (red entries)

### Debug Method 3: Console Debugging
Add debug logging to popup.js:
```javascript
// Add at the start of popup.js
console.log('Popup script loading...');

// Add in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing popup...');
    // existing code
});
```

## Manual Fixes

### Fix 1: Restore Working State
```bash
# Use test popup temporarily
cp manifest-test.json manifest.json

# Reload extension in chrome://extensions/
# Test basic functionality
```

### Fix 2: Regenerate Icons
```bash
# Create proper icons
node fix-icons.js

# Or use the HTML generator
open generate-proper-icons.html
# Download icons and replace in icons/ folder
```

### Fix 3: Simplify Popup (if main popup has issues)
Create minimal popup.html:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test</title>
    <style>
        body { width: 300px; height: 200px; padding: 20px; }
    </style>
</head>
<body>
    <h3>Extension Working!</h3>
    <button id="test">Test Button</button>
    <script>
        document.getElementById('test').onclick = () => {
            alert('Extension UI is working!');
        };
    </script>
</body>
</html>
```

### Fix 4: Check File Permissions
```bash
# Ensure all files are readable
chmod 644 *.html *.js *.css *.json
chmod 644 icons/*
```

## Verification Steps

### After Each Fix:
1. **Reload extension** in `chrome://extensions/`
2. **Clear browser cache**: Ctrl+Shift+Delete
3. **Test popup**: Click extension icon
4. **Check console**: Right-click icon → "Inspect popup"

### Success Indicators:
- ✅ Extension icon visible in toolbar
- ✅ Popup opens when clicked
- ✅ No errors in console
- ✅ UI elements respond to clicks

## Recovery Commands

### Restore Original Files:
```bash
# If you backed up manifest
cp manifest-backup.json manifest.json

# Regenerate icons
node fix-icons.js

# Validate everything
node validate-manifest.js
node test-extension.js
```

### Complete Reset:
```bash
# Remove extension from Chrome
# Delete and re-clone repository
# Follow installation steps again
```

## Getting Help

### Information to Collect:
1. **Chrome version**: `chrome://version/`
2. **Extension errors**: From `chrome://extensions/`
3. **Console errors**: From popup inspector
4. **File status**: `ls -la` output

### Debug Commands:
```bash
# Run full diagnostic
node debug-extension.js

# Check manifest
node validate-manifest.js

# Test extension
node test-extension.js
```

## Contact Support

If issues persist:
1. **Collect debug info** using commands above
2. **Screenshot errors** from Chrome extensions page
3. **Note Chrome version** and OS
4. **Describe exact steps** that lead to the issue

---

**Most Common Solution**: Use the test popup first (`manifest-test.json`) to verify basic extension loading, then gradually restore full functionality.

## Test Identification Issues

### Issue: Extension Not Finding Suggested Tests

**Symptoms**: 
- Extension shows "No test files identified"
- Analysis completes but returns empty results
- Mock data is shown instead of real test files

**Root Causes & Solutions**:

#### 1. GitHub Token Not Configured
**Problem**: Extension falls back to mock data without GitHub API access
**Solution**:
```bash
# Configure GitHub token in extension popup
1. Click extension icon
2. Go to "Configuration" tab
3. Add GitHub Personal Access Token
4. Save configuration
```

#### 2. Repository Access Issues
**Problem**: GitHub API returns 404 or 403 errors
**Debug Steps**:
```javascript
// Check browser console for these errors:
// "Repository not found" - Check repo name format (owner/repo)
// "GitHub API rate limit exceeded" - Wait or add token
// "GitHub API authentication failed" - Check token validity
```

#### 3. Test Pattern Matching Issues
**Problem**: Test files exist but patterns don't match
**Debug**: Check console for pattern matching logs:
```javascript
// Look for these console messages:
// "🔍 Testing X patterns for javascript: [patterns]"
// "🔍 Pattern *.test.js matched 0 files"
// "🔍 Alternative detection found: X tests"
```

#### 4. PR Data Extraction Issues
**Problem**: Extension can't extract PR information from page
**Debug Steps**:
```javascript
// Check console for:
// "🔍 Extracting GitHub PR data..."
// "🔍 PR Number: null" - Not on a PR page
// "🔍 Repository Path: null" - URL parsing failed
```

### Testing the Fixes

#### Test 1: Verify Extension Loading
```bash
1. Open any GitHub PR page
2. Open browser console (F12)
3. Click extension icon
4. Look for: "🔍 Starting analysis for:" in console
```

#### Test 2: Check GitHub API Access
```bash
1. Configure GitHub token in extension
2. Try analysis on a public repository PR
3. Check console for: "🔍 GitHub API response status: 200"
```

#### Test 3: Verify Test Detection
```bash
1. Use a repository with known test files
2. Check console for: "🔍 Total test files found: X"
3. If 0, check: "🔍 Alternative detection found: X tests"
```

#### Test 4: Pattern Debugging
```bash
# Add this to browser console to test patterns:
const testPattern = (pattern, files) => {
  const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
  return files.filter(f => regex.test(f));
};

// Test with your repository files
testPattern('**/*.test.js', ['src/app.test.js', 'lib/utils.js']);
```

### Enhanced Debugging

The extension now includes comprehensive logging. To debug test identification:

1. **Open browser console** before using extension
2. **Look for these key messages**:
   - `🔍 Starting analysis for:` - Analysis started
   - `🔍 Repository structure:` - GitHub API response
   - `🔍 Total test files found:` - Pattern matching results
   - `🔍 Alternative detection found:` - Fallback detection
   - `✅ Analysis complete:` - Final results

3. **Common fixes based on console output**:
   - No GitHub token: Add token in configuration
   - API errors: Check repository name and permissions
   - No patterns match: Repository may use different test structure
   - No code changes: Extension creates fallback changes

### Repository Requirements

For best results, your repository should have:
- **Test files** in standard locations (`test/`, `tests/`, `__tests__/`)
- **Standard naming** (`*.test.js`, `*.spec.js`, etc.)
- **Public access** or valid GitHub token for private repos

### Still Not Working?

If test identification still fails:

1. **Check the specific error** in console logs
2. **Try with a different repository** (e.g., a popular open-source project)
3. **Verify GitHub token** has correct permissions
4. **Test with mock data** to ensure UI is working
5. **Report the issue** with console logs and repository details

## Jenkins Pipeline Issues

### Issue: "Trigger Tests" Button Redirects to GitHub PR

**Symptoms**:
- Clicking "Trigger Tests" redirects to GitHub instead of triggering Jenkins
- No Jenkins pipeline is started
- Button doesn't show loading state

**Root Causes & Solutions**:

#### 1. Jenkins Configuration Missing
**Problem**: Jenkins URL, username, or API token not configured
**Solution**:
```bash
1. Click extension icon
2. Go to "Configuration" tab
3. Fill in Jenkins settings:
   - Jenkins URL (e.g., https://jenkins.company.com)
   - Username (your Jenkins username)
   - API Token (generate from Jenkins user settings)
   - Job Name (name of your test pipeline job)
4. Click "Save Configuration"
```

#### 2. Jenkins Authentication Issues
**Problem**: Invalid credentials or permissions
**Debug Steps**:
```javascript
// Check browser console for these errors:
// "Jenkins authentication failed" - Wrong username/token
// "Jenkins access denied" - Insufficient permissions
// "Jenkins job not found" - Wrong job name
```

**Solutions**:
- **Generate new API token**: Jenkins → User Settings → API Token → Add new token
- **Check permissions**: Ensure user can trigger builds for the specified job
- **Verify job name**: Check exact job name in Jenkins (case-sensitive)

#### 3. Network/CORS Issues
**Problem**: Browser blocks Jenkins API calls due to CORS
**Debug**: Check console for CORS errors
**Solutions**:
- Configure Jenkins CORS settings
- Use Jenkins proxy or different authentication method
- Check if Jenkins URL is accessible from browser

### Testing Jenkins Integration

#### Test 1: Verify Configuration
```bash
1. Open extension popup
2. Go to Configuration tab
3. Click "Test Connection" button
4. Should show "Jenkins connection successful!"
```

#### Test 2: Debug Pipeline Trigger
```bash
1. Open GitHub PR page
2. Open browser console (F12)
3. Run test analysis first
4. Click "Trigger Tests" button
5. Check console for these messages:
   - "🚀 Starting Jenkins pipeline trigger..."
   - "🚀 Jenkins API response status: 201" (or 200)
   - "✅ Pipeline trigger complete"
```

#### Test 3: Verify Jenkins Job
```bash
1. Check Jenkins dashboard
2. Look for new build in your job queue
3. Verify build parameters are passed correctly:
   - REPO_URL: GitHub repository URL
   - PR_NUMBER: Pull request number
   - TEST_FILES: Comma-separated test file names
   - BRANCH: PR branch name
```

### Common Jenkins Errors

#### Error: "Jenkins configuration incomplete"
**Fix**: Configure all required Jenkins settings in extension

#### Error: "Jenkins authentication failed"
**Fix**: 
1. Generate new API token in Jenkins
2. Use exact username (not email)
3. Check token permissions

#### Error: "Jenkins job not found"
**Fix**:
1. Verify job name spelling and case
2. Check if job exists in Jenkins
3. Ensure user has access to the job

#### Error: "Jenkins access denied"
**Fix**:
1. Check user permissions in Jenkins
2. Verify job-level permissions
3. Contact Jenkins administrator

### Jenkins Setup Requirements

For the extension to work with Jenkins:

1. **Jenkins Job Configuration**:
   - Job should accept build parameters
   - Parameters: REPO_URL, PR_NUMBER, TEST_FILES, BRANCH
   - Job should be configured to run tests based on these parameters

2. **Jenkins Security**:
   - User must have "Build" permission for the job
   - API token must be generated and valid
   - CORS may need configuration for browser access

3. **Network Access**:
   - Jenkins URL must be accessible from browser
   - No firewall blocking the connection
   - HTTPS recommended for security

### Enhanced Debugging

The extension now includes comprehensive Jenkins logging:

1. **Open browser console** before triggering pipeline
2. **Look for these key messages**:
   - `🚀 Starting Jenkins pipeline trigger...` - Trigger started
   - `🚀 Jenkins config:` - Configuration details
   - `🚀 Jenkins API URL:` - API endpoint being called
   - `🚀 Jenkins API response status:` - HTTP response code
   - `✅ Pipeline trigger complete:` - Success with build details

3. **Common fixes based on console output**:
   - Missing config: Configure Jenkins settings
   - 401 error: Check username and API token
   - 404 error: Verify job name and URL
   - Network error: Check Jenkins accessibility

### Still Having Issues?

If Jenkins integration still doesn't work:

1. **Test Jenkins API manually**:
   ```bash
   curl -X POST "https://your-jenkins.com/job/your-job/buildWithParameters" \
        -u "username:api-token" \
        -d "REPO_URL=https://github.com/owner/repo.git&PR_NUMBER=123"
   ```

2. **Check Jenkins logs** for any server-side errors

3. **Verify job configuration** accepts the required parameters

4. **Contact Jenkins administrator** if permissions are needed
