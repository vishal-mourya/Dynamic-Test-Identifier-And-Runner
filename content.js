// Content script for detecting PR pages and extracting code changes
class PRAnalyzer {
  constructor() {
    this.platform = this.detectPlatform();
    this.prData = null;
    this.codeChanges = [];
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('github.com')) return 'github';
    if (hostname.includes('gitlab.com')) return 'gitlab';
    if (hostname.includes('bitbucket.org')) return 'bitbucket';
    return 'unknown';
  }

  init() {
    // Dynamic Test Runner: Initializing
    this.createUI();
    this.extractPRData();
    this.observeChanges();
    this.setupMessageListener();
  }

  createUI() {
    // Create floating action button
    const fab = document.createElement('div');
    fab.id = 'test-runner-fab';
    fab.innerHTML = `
      <div class="fab-container">
        <button class="fab-button" id="analyze-tests-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <div class="fab-tooltip">Analyze & Run Tests</div>
      </div>
    `;
    document.body.appendChild(fab);

    // Create results panel
    const panel = document.createElement('div');
    panel.id = 'test-runner-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>Test Analysis Results</h3>
        <button class="close-btn" id="close-panel">×</button>
      </div>
      <div class="panel-content">
        <div class="loading" id="loading-indicator">
          <div class="spinner"></div>
          <p>Analyzing code changes...</p>
        </div>
        <div class="results" id="test-results" style="display: none;">
          <div class="section">
            <h4>Identified Test Files</h4>
            <ul id="test-files-list"></ul>
          </div>
          <div class="section">
            <h4>Code Coverage Analysis</h4>
            <div id="coverage-info"></div>
          </div>
          <div class="section">
            <h4>Jenkins Pipeline</h4>
            <div id="pipeline-status"></div>
            <button id="trigger-pipeline" class="action-btn">Trigger Tests</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('analyze-tests-btn').addEventListener('click', () => {
      this.showPanel();
      this.analyzeTests();
    });

    document.getElementById('close-panel').addEventListener('click', () => {
      this.hidePanel();
    });

    document.getElementById('trigger-pipeline').addEventListener('click', () => {
      this.triggerJenkinsPipeline();
    });
  }

  showPanel() {
    document.getElementById('test-runner-panel').classList.add('visible');
  }

  hidePanel() {
    document.getElementById('test-runner-panel').classList.remove('visible');
  }

  extractPRData() {
    switch (this.platform) {
      case 'github':
        this.extractGitHubPRData();
        break;
      case 'gitlab':
        this.extractGitLabPRData();
        break;
      case 'bitbucket':
        this.extractBitbucketPRData();
        break;
    }
  }

  extractGitHubPRData() {
    const prNumber = window.location.pathname.match(/\/pull\/(\d+)/)?.[1];
    const repoPath = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/)?.[1];
    
    console.log('🔍 Extracting GitHub PR data...');
    console.log('🔍 URL:', window.location.href);
    console.log('🔍 PR Number:', prNumber);
    console.log('🔍 Repository Path:', repoPath);
    
    // Try multiple selectors for title
    const titleSelectors = [
      '.js-issue-title',
      '.gh-header-title .js-issue-title',
      '[data-testid="issue-title"]',
      '.gh-header-title bdi',
      'h1 bdi'
    ];
    
    let title = null;
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        title = element.textContent?.trim();
        console.log(`🔍 Found title with selector '${selector}':`, title);
        break;
      }
    }
    
    // Try multiple selectors for author
    const authorSelectors = [
      '.author',
      '.timeline-comment-header .author',
      '[data-hovercard-type="user"]',
      '.gh-header-meta .author'
    ];
    
    let author = null;
    for (const selector of authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        author = element.textContent?.trim();
        console.log(`🔍 Found author with selector '${selector}':`, author);
        break;
      }
    }
    
    // Try multiple selectors for branches
    const baseBranchSelectors = [
      '.base-ref',
      '.commit-ref.base-ref',
      '[data-testid="base-ref"]'
    ];
    
    const headBranchSelectors = [
      '.head-ref',
      '.commit-ref.head-ref',
      '[data-testid="head-ref"]'
    ];
    
    let baseBranch = null;
    for (const selector of baseBranchSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        baseBranch = element.textContent?.trim();
        break;
      }
    }
    
    let headBranch = null;
    for (const selector of headBranchSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        headBranch = element.textContent?.trim();
        break;
      }
    }
    
    this.prData = {
      platform: 'github',
      repository: repoPath,
      prNumber: prNumber,
      title: title || 'Unknown PR Title',
      author: author || 'Unknown Author',
      baseBranch: baseBranch || 'main',
      headBranch: headBranch || 'feature-branch'
    };
    
    console.log('🔍 Extracted PR data:', this.prData);
    this.extractGitHubCodeChanges();
  }

  extractGitLabPRData() {
    const mrNumber = window.location.pathname.match(/\/merge_requests\/(\d+)/)?.[1];
    const repoPath = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/)?.[1];
    
    this.prData = {
      platform: 'gitlab',
      repository: repoPath,
      prNumber: mrNumber,
      title: document.querySelector('.detail-page-header-body .title')?.textContent?.trim(),
      author: document.querySelector('.author-link')?.textContent?.trim(),
      baseBranch: document.querySelector('.mr-source-target .ref-name')?.textContent?.trim(),
      headBranch: document.querySelector('.mr-source-target .ref-name:last-child')?.textContent?.trim()
    };

    this.extractGitLabCodeChanges();
  }

  extractBitbucketPRData() {
    const prNumber = window.location.pathname.match(/\/pull-requests\/(\d+)/)?.[1];
    const repoPath = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/)?.[1];
    
    this.prData = {
      platform: 'bitbucket',
      repository: repoPath,
      prNumber: prNumber,
      title: document.querySelector('[data-testid="pr-title"]')?.textContent?.trim(),
      author: document.querySelector('[data-testid="pr-author"]')?.textContent?.trim()
    };

    this.extractBitbucketCodeChanges();
  }

  extractGitHubCodeChanges() {
    console.log('🔍 Extracting GitHub code changes...');
    
    // Try multiple selectors for diff elements
    const diffSelectors = [
      '.file-diff-split',
      '.file-diff-unified', 
      '.file',
      '.js-file',
      '[data-tagsearch-path]'
    ];
    
    let diffElements = [];
    for (const selector of diffSelectors) {
      diffElements = document.querySelectorAll(selector);
      if (diffElements.length > 0) {
        console.log(`🔍 Found ${diffElements.length} diff elements with selector '${selector}'`);
        break;
      }
    }
    
    this.codeChanges = [];

    diffElements.forEach((diff, index) => {
      console.log(`🔍 Processing diff element ${index + 1}/${diffElements.length}`);
      
      // Try multiple selectors for file name
      const fileNameSelectors = [
        '.file-header .file-info a',
        '.file-header [data-path]',
        '.file-header .file-info span[title]',
        '.js-file-header [data-path]',
        '.file-header .Link--primary'
      ];
      
      let fileName = null;
      for (const selector of fileNameSelectors) {
        const element = diff.querySelector(selector);
        if (element) {
          fileName = element.textContent?.trim() || element.getAttribute('data-path') || element.getAttribute('title');
          if (fileName) {
            console.log(`🔍 Found filename with selector '${selector}':`, fileName);
            break;
          }
        }
      }
      
      if (!fileName) {
        console.warn('⚠️ Could not extract filename from diff element');
        return;
      }

      const addedLines = [];
      const removedLines = [];
      const modifiedFunctions = [];

      // Extract added lines with multiple selectors
      const addedLineSelectors = [
        '.blob-code-addition',
        '.blob-code.blob-code-addition',
        '[data-code-marker="+"]',
        '.added'
      ];
      
      let addedLineElements = [];
      for (const selector of addedLineSelectors) {
        addedLineElements = diff.querySelectorAll(selector);
        if (addedLineElements.length > 0) break;
      }
      
      addedLineElements.forEach(line => {
        const lineNumber = line.querySelector('.blob-num-addition, .blob-num')?.textContent?.trim();
        const content = line.querySelector('.blob-code-inner, .blob-code')?.textContent?.trim() || line.textContent?.trim();
        if (content && content.length > 0) {
          addedLines.push({ lineNumber, content });
          
          // Detect function/method definitions
          if (this.isFunctionDefinition(content)) {
            const funcName = this.extractFunctionName(content);
            if (funcName && !modifiedFunctions.includes(funcName)) {
              modifiedFunctions.push(funcName);
            }
          }
        }
      });

      // Extract removed lines with multiple selectors
      const removedLineSelectors = [
        '.blob-code-deletion',
        '.blob-code.blob-code-deletion',
        '[data-code-marker="-"]',
        '.removed'
      ];
      
      let removedLineElements = [];
      for (const selector of removedLineSelectors) {
        removedLineElements = diff.querySelectorAll(selector);
        if (removedLineElements.length > 0) break;
      }
      
      removedLineElements.forEach(line => {
        const lineNumber = line.querySelector('.blob-num-deletion, .blob-num')?.textContent?.trim();
        const content = line.querySelector('.blob-code-inner, .blob-code')?.textContent?.trim() || line.textContent?.trim();
        if (content && content.length > 0) {
          removedLines.push({ lineNumber, content });
        }
      });

      const changeData = {
        fileName,
        fileExtension: this.getFileExtension(fileName),
        addedLines,
        removedLines,
        modifiedFunctions,
        changeType: this.determineChangeType(addedLines, removedLines)
      };
      
      console.log(`🔍 Extracted change data for ${fileName}:`, {
        addedLines: addedLines.length,
        removedLines: removedLines.length,
        modifiedFunctions: modifiedFunctions.length,
        changeType: changeData.changeType
      });
      
      this.codeChanges.push(changeData);
    });
    
    console.log(`🔍 Total code changes extracted: ${this.codeChanges.length}`);
    
    // If no changes found, create a fallback
    if (this.codeChanges.length === 0) {
      console.warn('⚠️ No code changes detected, creating fallback change');
      this.codeChanges = [{
        fileName: 'src/main.js',
        fileExtension: 'js',
        addedLines: [{ lineNumber: '1', content: 'function main() { return true; }' }],
        removedLines: [],
        modifiedFunctions: ['main'],
        changeType: 'modified'
      }];
    }
  }

  extractGitLabCodeChanges() {
    const diffElements = document.querySelectorAll('.diff-file');
    this.codeChanges = [];

    diffElements.forEach(diff => {
      const fileName = diff.querySelector('.diff-file-header .file-title-name')?.textContent?.trim();
      
      if (!fileName) return;

      const addedLines = [];
      const removedLines = [];
      const modifiedFunctions = [];

      // Extract changes from GitLab diff format
      diff.querySelectorAll('.line_content.new').forEach(line => {
        const content = line.textContent?.trim();
        if (content) {
          addedLines.push({ content });
          
          if (this.isFunctionDefinition(content)) {
            modifiedFunctions.push(this.extractFunctionName(content));
          }
        }
      });

      diff.querySelectorAll('.line_content.old').forEach(line => {
        const content = line.textContent?.trim();
        if (content) {
          removedLines.push({ content });
        }
      });

      this.codeChanges.push({
        fileName,
        fileExtension: this.getFileExtension(fileName),
        addedLines,
        removedLines,
        modifiedFunctions,
        changeType: this.determineChangeType(addedLines, removedLines)
      });
    });
  }

  extractBitbucketCodeChanges() {
    // Similar implementation for Bitbucket
    const diffElements = document.querySelectorAll('[data-testid="file-diff"]');
    this.codeChanges = [];

    diffElements.forEach(diff => {
      const fileName = diff.querySelector('[data-testid="file-path"]')?.textContent?.trim();
      
      if (!fileName) return;

      const addedLines = [];
      const removedLines = [];
      const modifiedFunctions = [];

      // Extract Bitbucket diff changes
      diff.querySelectorAll('[data-testid="diff-line-added"]').forEach(line => {
        const content = line.textContent?.trim();
        if (content) {
          addedLines.push({ content });
          
          if (this.isFunctionDefinition(content)) {
            modifiedFunctions.push(this.extractFunctionName(content));
          }
        }
      });

      this.codeChanges.push({
        fileName,
        fileExtension: this.getFileExtension(fileName),
        addedLines,
        removedLines,
        modifiedFunctions,
        changeType: this.determineChangeType(addedLines, removedLines)
      });
    });
  }

  isFunctionDefinition(line) {
    // Detect function definitions in various languages
    const patterns = [
      /^\s*(public|private|protected)?\s*(static)?\s*(async)?\s*function\s+\w+/i, // JavaScript/PHP
      /^\s*(public|private|protected)?\s*(static)?\s*\w+\s*\([^)]*\)\s*{/i, // Java/C#
      /^\s*def\s+\w+/i, // Python
      /^\s*(public|private):\s*$/i, // C++
      /^\s*class\s+\w+/i, // Class definitions
      /^\s*interface\s+\w+/i, // Interface definitions
      /^\s*const\s+\w+\s*=/i, // Const declarations
      /^\s*let\s+\w+\s*=/i, // Let declarations
      /^\s*var\s+\w+\s*=/i // Var declarations
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  extractFunctionName(line) {
    const patterns = [
      /function\s+(\w+)/i,
      /def\s+(\w+)/i,
      /class\s+(\w+)/i,
      /interface\s+(\w+)/i,
      /(const|let|var)\s+(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[1] || match[2];
    }

    return 'unknown';
  }

  getFileExtension(fileName) {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  determineChangeType(addedLines, removedLines) {
    if (addedLines.length > 0 && removedLines.length > 0) return 'modified';
    if (addedLines.length > 0) return 'added';
    if (removedLines.length > 0) return 'deleted';
    return 'unchanged';
  }

  async analyzeTests() {
    document.getElementById('loading-indicator').style.display = 'block';
    document.getElementById('test-results').style.display = 'none';

    try {
      // Re-extract data to ensure we have the latest
      this.extractPRData();
      
      // Debug: Log extracted data
      console.log('🔍 PR Data extracted:', this.prData);
      console.log('🔍 Code changes extracted:', this.codeChanges);
      
      // Validate data before sending
      if (!this.prData || !this.prData.repository) {
        throw new Error('Could not extract PR repository information from page. Make sure you are on a Pull Request page.');
      }
      
      if (!this.prData.repository.includes('/')) {
        throw new Error(`Invalid repository format: ${this.prData.repository}. Expected format: owner/repo`);
      }
      
      if (!this.codeChanges || this.codeChanges.length === 0) {
        console.warn('⚠️ No code changes detected, using fallback');
        this.codeChanges = [{ 
          fileName: 'src/main.js', 
          fileExtension: 'js',
          changeType: 'modified',
          modifiedFunctions: ['main'],
          addedLines: [],
          removedLines: []
        }];
      }

      // Send data to background script for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeTests',
        prData: this.prData,
        codeChanges: this.codeChanges
      });

      console.log('🔍 Analysis response:', response);
      
      if (response && response.error) {
        throw new Error(response.error);
      }

      this.displayResults(response);
    } catch (error) {
      console.error('❌ Analysis error:', error);
      this.displayError(error.message);
    }
  }

  displayResults(results) {
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('test-results').style.display = 'block';

    console.log('🔍 Displaying results:', results);

    // Display identified test files
    const testFilesList = document.getElementById('test-files-list');
    testFilesList.innerHTML = '';
    
    if (!results.identifiedTests || results.identifiedTests.length === 0) {
      testFilesList.innerHTML = `
        <li class="no-tests">
          <div class="test-file">
            <span class="file-name">No test files identified</span>
            <div class="test-methods">Try configuring your GitHub token or check if the repository has test files</div>
          </div>
        </li>
      `;
    } else {
      results.identifiedTests.forEach(test => {
        const methods = test.methods || test.estimatedMethods || ['test methods'];
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="test-file">
            <span class="file-name">${test.fileName}</span>
            <span class="confidence">Confidence: ${test.confidence}%</span>
            <div class="test-methods">${Array.isArray(methods) ? methods.join(', ') : methods}</div>
            <div class="test-reason">${test.reason || 'Identified as test file'}</div>
          </div>
        `;
        testFilesList.appendChild(li);
      });
    }

    // Display coverage info
    const coverageInfo = document.getElementById('coverage-info');
    const coverage = results.coverage || {};
    
    // Ensure coverage percentage is reasonable (0-100%)
    const coveragePercent = Math.max(0, Math.min(100, coverage.estimated || coverage.estimatedCoverage || 0));
    
    coverageInfo.innerHTML = `
      <div class="coverage-stats">
        <div class="stat">
          <label>Estimated Coverage:</label>
          <span class="coverage-value ${coveragePercent >= 80 ? 'excellent' : coveragePercent >= 60 ? 'good' : coveragePercent >= 40 ? 'fair' : 'poor'}">${coveragePercent}%</span>
        </div>
        <div class="stat">
          <label>Critical Paths:</label>
          <span>${coverage.criticalPaths || 0}</span>
        </div>
        <div class="stat">
          <label>Risk Score:</label>
          <span class="risk-value ${(coverage.riskScore || 0) > 50 ? 'high' : (coverage.riskScore || 0) > 25 ? 'medium' : 'low'}">${coverage.riskScore || 0}</span>
        </div>
        <div class="stat">
          <label>Test Quality:</label>
          <span class="quality-value">${coverage.testCoverage || 'Unknown'}</span>
        </div>
      </div>
    `;
    
    // Show any error messages or notes
    if (results.error) {
      coverageInfo.innerHTML += `
        <div class="error-note">
          <strong>Note:</strong> ${results.error}
        </div>
      `;
    }
    
    if (results.note) {
      coverageInfo.innerHTML += `
        <div class="info-note">
          <strong>Info:</strong> ${results.note}
        </div>
      `;
    }

    // Display pipeline status
    const pipelineStatus = document.getElementById('pipeline-status');
    const testsCount = results.identifiedTests ? results.identifiedTests.length : 0;
    pipelineStatus.innerHTML = `
      <div class="pipeline-info">
        <div class="status">Status: <span class="${testsCount > 0 ? 'ready' : 'warning'}">${
          testsCount > 0 ? 'Ready' : 'No tests identified'
        }</span></div>
        <div class="tests-count">Tests to run: ${testsCount}</div>
        <div class="estimated-time">Estimated time: ${results.estimatedRunTime || 'Unknown'}</div>
      </div>
    `;
  }

  displayError(message) {
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('test-results').innerHTML = `
      <div class="error-message">
        <h4>Error</h4>
        <p>${message}</p>
      </div>
    `;
    document.getElementById('test-results').style.display = 'block';
  }

  async triggerJenkinsPipeline() {
    console.log('🚀 Triggering Jenkins pipeline...');
    
    // Show loading state
    const triggerBtn = document.getElementById('trigger-pipeline');
    const originalText = triggerBtn.textContent;
    triggerBtn.textContent = 'Triggering...';
    triggerBtn.disabled = true;
    
    try {
      // Validate data before sending
      if (!this.prData || !this.prData.repository) {
        throw new Error('PR data not available. Please run analysis first.');
      }
      
      const testFiles = this.getSelectedTestFiles();
      console.log('🚀 Test files to run:', testFiles);
      
      if (testFiles.length === 0) {
        throw new Error('No test files selected. Please run analysis first.');
      }
      
      console.log('🚀 Sending pipeline trigger request...');
      
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        throw new Error('Extension context invalidated. Please reload the page and try again.');
      }
      
      const response = await chrome.runtime.sendMessage({
        action: 'triggerJenkinsPipeline',
        prData: this.prData,
        testFiles: testFiles
      });
      
      console.log('🚀 Pipeline response:', response);
      
      if (response && response.error) {
        throw new Error(response.error);
      }
      
      if (response && response.success) {
        this.updatePipelineStatus(response);
        this.showMessage('Jenkins pipeline triggered successfully!', 'success');
      } else {
        throw new Error('Invalid response from Jenkins API');
      }
      
    } catch (error) {
      console.error('❌ Pipeline trigger error:', error);
      this.showMessage(`Failed to trigger pipeline: ${error.message}`, 'error');
      this.updatePipelineStatus({ error: error.message });
    } finally {
      // Restore button state
      triggerBtn.textContent = originalText;
      triggerBtn.disabled = false;
    }
  }

  getSelectedTestFiles() {
    // Get currently selected/identified test files
    const testElements = document.querySelectorAll('#test-files-list .test-file');
    return Array.from(testElements).map(el => ({
      fileName: el.querySelector('.file-name').textContent,
      methods: el.querySelector('.test-methods').textContent.split(', ')
    }));
  }

  updatePipelineStatus(response) {
    const pipelineStatus = document.getElementById('pipeline-status');
    
    if (response.error) {
      pipelineStatus.innerHTML = `
        <div class="pipeline-info">
          <div class="status">Status: <span class="error">Failed</span></div>
          <div class="error-message">Error: ${response.error}</div>
          <div class="help-text">Check Jenkins configuration in extension settings</div>
        </div>
      `;
    } else if (response.success) {
      pipelineStatus.innerHTML = `
        <div class="pipeline-info">
          <div class="status">Status: <span class="running">Running</span></div>
          <div class="build-number">Build: #${response.buildNumber}</div>
          <div class="jenkins-link">
            <a href="${response.buildUrl}" target="_blank">View in Jenkins</a>
          </div>
          <div class="help-text">Pipeline started successfully</div>
        </div>
      `;
    } else {
      pipelineStatus.innerHTML = `
        <div class="pipeline-info">
          <div class="status">Status: <span class="warning">Unknown</span></div>
          <div class="help-text">Unexpected response from Jenkins</div>
        </div>
      `;
    }
  }

  showMessage(text, type = 'info') {
    // Remove existing messages in the panel
    const existingMessages = document.querySelectorAll('#test-runner-panel .message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
      <span class="message-icon">${type === 'success' ? '✓' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="message-text">${text}</span>
    `;

    // Insert at the top of panel content
    const panelContent = document.querySelector('#test-runner-panel .panel-content');
    if (panelContent) {
      panelContent.insertBefore(message, panelContent.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 5000);
  }

  observeChanges() {
    // Observe DOM changes to detect when PR content is updated
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Re-extract PR data if content changes
          this.extractPRData();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupMessageListener() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'triggerAnalysis') {
        this.analyzeTests();
        sendResponse({ success: true });
      }
      return true;
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PRAnalyzer());
} else {
  new PRAnalyzer();
}
