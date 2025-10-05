// Popup JavaScript for Dynamic Test Runner
class PopupManager {
  constructor() {
    this.config = null;
    this.stats = {
      testsRunToday: 0,
      successRate: 0,
      avgRuntime: 0
    };
    this.init();
  }

  async init() {
    await this.loadConfig();
    await this.loadStats();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      this.config = response || this.getDefaultConfig();
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['testRunnerStats']);
      this.stats = result.testRunnerStats || this.stats;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  getDefaultConfig() {
    return {
      jenkins: {
        url: '',
        username: '',
        token: '',
        jobName: 'test-runner-pipeline'
      },
      github: {
        token: ''
      },
      gitlab: {
        token: ''
      },
      bitbucket: {
        username: '',
        appPassword: ''
      },
      coverageThreshold: 80,
      maxTestsToRun: 50,
      autoTrigger: false
    };
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Dashboard actions
    document.getElementById('analyze-current-pr').addEventListener('click', () => {
      this.analyzeCurrentPR();
    });

    document.getElementById('view-last-results').addEventListener('click', () => {
      this.viewLastResults();
    });

    // Configuration actions
    document.getElementById('save-config').addEventListener('click', () => {
      this.saveConfiguration();
    });

    document.getElementById('test-connection').addEventListener('click', () => {
      this.testConnection();
    });

    // History actions
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });

    // Footer links
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });

    document.getElementById('feedback-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openFeedback();
    });

    // Auto-save config inputs
    this.setupConfigInputListeners();
  }

  setupConfigInputListeners() {
    const inputs = [
      'jenkins-url', 'jenkins-username', 'jenkins-token', 'jenkins-job',
      'github-token', 'gitlab-token', 'bitbucket-username', 'bitbucket-password',
      'coverage-threshold', 'max-tests', 'auto-trigger'
    ];

    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          this.updateConfigFromInputs();
        });
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load tab-specific data
    if (tabName === 'history') {
      this.loadHistory();
    }
  }

  updateUI() {
    this.updateDashboard();
    this.updateConfigForm();
  }

  updateDashboard() {
    // Update stats
    document.getElementById('tests-run-today').textContent = this.stats.testsRunToday;
    document.getElementById('success-rate').textContent = `${this.stats.successRate}%`;
    document.getElementById('avg-runtime').textContent = `${this.stats.avgRuntime}m`;

    // Update status indicator
    const statusIndicator = document.getElementById('status-indicator');
    const isConfigured = this.isConfigurationComplete();
    
    if (isConfigured) {
      statusIndicator.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">Ready</span>
      `;
    } else {
      statusIndicator.innerHTML = `
        <span class="status-dot" style="background: #ffc107;"></span>
        <span class="status-text">Configuration Required</span>
      `;
    }
  }

  updateConfigForm() {
    // Populate Jenkins config
    document.getElementById('jenkins-url').value = this.config.jenkins.url || '';
    document.getElementById('jenkins-username').value = this.config.jenkins.username || '';
    document.getElementById('jenkins-token').value = this.config.jenkins.token || '';
    document.getElementById('jenkins-job').value = this.config.jenkins.jobName || '';
    document.getElementById('jenkins-build-token').value = this.config.jenkins.buildToken || '';

    // Populate Git platform tokens
    document.getElementById('github-token').value = this.config.github.token || '';
    document.getElementById('gitlab-token').value = this.config.gitlab.token || '';
    document.getElementById('bitbucket-username').value = this.config.bitbucket.username || '';
    document.getElementById('bitbucket-password').value = this.config.bitbucket.appPassword || '';

    // Populate test settings
    document.getElementById('coverage-threshold').value = this.config.coverageThreshold || 80;
    document.getElementById('max-tests').value = this.config.maxTestsToRun || 50;
    document.getElementById('auto-trigger').checked = this.config.autoTrigger || false;
  }

  updateConfigFromInputs() {
    this.config.jenkins.url = document.getElementById('jenkins-url').value.trim();
    this.config.jenkins.username = document.getElementById('jenkins-username').value.trim();
    this.config.jenkins.token = document.getElementById('jenkins-token').value.trim();
    this.config.jenkins.jobName = document.getElementById('jenkins-job').value.trim();
    this.config.jenkins.buildToken = document.getElementById('jenkins-build-token').value.trim();

    this.config.github.token = document.getElementById('github-token').value.trim();
    this.config.gitlab.token = document.getElementById('gitlab-token').value.trim();
    this.config.bitbucket.username = document.getElementById('bitbucket-username').value.trim();
    this.config.bitbucket.appPassword = document.getElementById('bitbucket-password').value.trim();
    
    this.config.coverageThreshold = parseInt(document.getElementById('coverage-threshold').value) || 80;
    this.config.maxTestsToRun = parseInt(document.getElementById('max-tests').value) || 50;
    this.config.autoTrigger = document.getElementById('auto-trigger').checked;
  }

  isConfigurationComplete() {
    const jenkins = this.config.jenkins;
    const hasJenkins = jenkins.url && jenkins.username && jenkins.token;
    const hasGitPlatform = this.config.github.token || this.config.gitlab.token || 
                          (this.config.bitbucket.username && this.config.bitbucket.appPassword);
    
    return hasJenkins && hasGitPlatform;
  }

  async analyzeCurrentPR() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isPRPage(tab.url)) {
        this.showMessage('Please navigate to a Pull Request page first.', 'error');
        return;
      }

      if (!this.isConfigurationComplete()) {
        this.showMessage('Please complete the configuration first.', 'error');
        this.switchTab('config');
        return;
      }

      // Send message to content script to trigger analysis
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'triggerAnalysis' });
        if (response && response.success) {
          this.showMessage('Analysis started! Check the PR page for results.', 'success');
        } else {
          throw new Error('Content script not responding');
        }
      } catch (messageError) {
        // Content script might not be loaded, try to inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Try again after injection
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'triggerAnalysis' });
            this.showMessage('Analysis started! Check the PR page for results.', 'success');
          } catch (retryError) {
            throw new Error('Failed to communicate with PR page. Please refresh the page and try again.');
          }
        }, 1000);
      }
      
      // Update stats
      this.stats.testsRunToday++;
      await this.saveStats();
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error analyzing PR:', error);
      this.showMessage('Error starting analysis. Please try again.', 'error');
    }
  }

  isPRPage(url) {
    const prPatterns = [
      /github\.com\/.*\/pull\/\d+/,
      /gitlab\.com\/.*\/merge_requests\/\d+/,
      /bitbucket\.org\/.*\/pull-requests\/\d+/
    ];
    
    return prPatterns.some(pattern => pattern.test(url));
  }

  async viewLastResults() {
    try {
      const result = await chrome.storage.local.get(['lastTestResults']);
      const lastResults = result.lastTestResults;
      
      if (!lastResults) {
        this.showMessage('No previous test results found.', 'error');
        return;
      }

      // Switch to history tab and show results
      this.switchTab('history');
      this.displayTestResults(lastResults);
      
    } catch (error) {
      console.error('Error loading last results:', error);
      this.showMessage('Error loading results.', 'error');
    }
  }

  async saveConfiguration() {
    try {
      this.updateConfigFromInputs();
      
      // Validate configuration
      if (!this.validateConfiguration()) {
        return;
      }

      // Save to background script
      await chrome.runtime.sendMessage({
        action: 'updateConfig',
        config: this.config
      });

      this.showMessage('Configuration saved successfully!', 'success');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.showMessage('Error saving configuration.', 'error');
    }
  }

  validateConfiguration() {
    const jenkins = this.config.jenkins;
    
    if (!jenkins.url) {
      this.showMessage('Jenkins URL is required.', 'error');
      return false;
    }

    if (!jenkins.username || !jenkins.token) {
      this.showMessage('Jenkins username and token are required.', 'error');
      return false;
    }

    const hasGitPlatform = this.config.github.token || this.config.gitlab.token || 
                          (this.config.bitbucket.username && this.config.bitbucket.appPassword);
    
    if (!hasGitPlatform) {
      this.showMessage('At least one Git platform token is required.', 'error');
      return false;
    }

    return true;
  }

  async testConnection() {
    try {
      this.updateConfigFromInputs();
      
      const testBtn = document.getElementById('test-connection');
      testBtn.textContent = 'Testing...';
      testBtn.disabled = true;

      // Use the enhanced Jenkins connection test
      const response = await chrome.runtime.sendMessage({
        action: 'testJenkinsConnection'
      });

      console.log('🔧 Connection test result:', response);

      if (response.success) {
        this.showMessage(`Jenkins connection successful! ${response.message}`, 'success');
        
        // Show additional details if available
        if (response.details) {
          const details = response.details;
          let detailsMsg = `Job: ${details.jobName}`;
          if (details.buildable !== undefined) {
            detailsMsg += `, Buildable: ${details.buildable}`;
          }
          if (details.jenkinsVersion) {
            detailsMsg += `, Jenkins: ${details.jenkinsVersion}`;
          }
          console.log('🔧 Connection details:', detailsMsg);
        }
      } else {
        let errorMsg = `Jenkins connection failed: ${response.error}`;
        if (response.details) {
          errorMsg += ` - ${response.details}`;
        }
        this.showMessage(errorMsg, 'error');
        
        // Provide specific guidance based on error type
        if (response.error.includes('Authentication failed')) {
          this.showMessage('💡 Tip: Generate a new API token in Jenkins → User Settings → API Token', 'info');
        } else if (response.error.includes('Job access denied')) {
          this.showMessage('💡 Tip: Ask Jenkins admin to grant build permissions for this job', 'info');
        } else if (response.error.includes('Job not found')) {
          this.showMessage('💡 Tip: Check the job name spelling and ensure it exists', 'info');
        }
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      this.showMessage('Connection test failed: ' + error.message, 'error');
    } finally {
      const testBtn = document.getElementById('test-connection');
      testBtn.textContent = 'Test Connection';
      testBtn.disabled = false;
    }
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['testRunHistory']);
      const history = result.testRunHistory || [];
      
      const historyList = document.getElementById('history-list');
      
      if (history.length === 0) {
        historyList.innerHTML = `
          <div class="history-item">
            <div class="history-icon">📊</div>
            <div class="history-content">
              <div class="history-title">No test runs yet</div>
              <div class="history-subtitle">Your test history will appear here</div>
            </div>
          </div>
        `;
        return;
      }

      historyList.innerHTML = history.map(item => `
        <div class="history-item">
          <div class="history-icon">${this.getStatusIcon(item.status)}</div>
          <div class="history-content">
            <div class="history-title">${item.repository} #${item.prNumber}</div>
            <div class="history-subtitle">
              ${item.testsRun} tests • ${item.status} • ${this.formatDate(item.timestamp)}
            </div>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'FAILED': return '❌';
      case 'RUNNING': return '🔄';
      default: return '📊';
    }
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  async clearHistory() {
    try {
      await chrome.storage.local.remove(['testRunHistory']);
      this.loadHistory();
      this.showMessage('History cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      this.showMessage('Error clearing history.', 'error');
    }
  }

  displayTestResults(results) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = `
      <div class="history-item">
        <div class="history-icon">${this.getStatusIcon(results.status)}</div>
        <div class="history-content">
          <div class="history-title">Last Test Results</div>
          <div class="history-subtitle">
            ${results.testsRun} tests • ${results.status} • ${results.duration}
          </div>
        </div>
      </div>
    `;
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({ testRunnerStats: this.stats });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert at the top of current tab content
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(message, activeTab.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 5000);
  }

  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/your-repo/dynamic-test-runner/wiki'
    });
  }

  openFeedback() {
    chrome.tabs.create({
      url: 'https://github.com/your-repo/dynamic-test-runner/issues/new'
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    // Update popup stats when background script reports new data
    const popup = window.popupManager;
    if (popup) {
      popup.stats = { ...popup.stats, ...request.stats };
      popup.updateDashboard();
    }
  }
});
