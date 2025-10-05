/**
 * Background Service Worker - Main Entry Point
 * Coordinates all background services and handles message routing
 */

import GitService from './services/GitService.js';
import JenkinsService from './services/JenkinsService.js';
import TestAnalysisService from './services/TestAnalysisService.js';
import { storage } from '../shared/utils/storage.js';
import { backgroundLogger as logger } from '../shared/utils/logger.js';
import { DEFAULT_CONFIG, STORAGE_KEYS, MESSAGE_TYPES } from '../shared/config/defaults.js';
import { validateConfig } from '../shared/utils/validator.js';

class BackgroundController {
  constructor() {
    this.config = null;
    this.gitService = null;
    this.jenkinsService = null;
    this.testService = null;
    
    this.init();
  }

  /**
   * Initialize background service
   */
  async init() {
    logger.info('Initializing background service worker');
    
    try {
      await this.loadConfig();
      this.initializeServices();
      this.setupMessageListeners();
      this.setupContextMenus();
      
      logger.info('Background service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize background service:', error);
      // Use default config as fallback
      this.config = DEFAULT_CONFIG;
      this.initializeServices();
    }
  }

  /**
   * Load configuration from storage
   */
  async loadConfig() {
    this.config = await storage.get(STORAGE_KEYS.CONFIG, {
      defaultValue: DEFAULT_CONFIG,
      useCache: true
    });

    logger.debug('Configuration loaded', { config: this.config });
  }

  /**
   * Initialize services with current configuration
   */
  initializeServices() {
    this.gitService = new GitService(this.config);
    this.jenkinsService = new JenkinsService(this.config);
    this.testService = new TestAnalysisService(this.config);
    
    logger.debug('Services initialized');
  }

  /**
   * Setup message listeners
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender)
        .then(response => sendResponse(response))
        .catch(error => {
          logger.error('Message handler error:', error);
          sendResponse({ error: error.message });
        });
      
      return true; // Keep channel open for async response
    });

    logger.debug('Message listeners setup complete');
  }

  /**
   * Setup context menus
   */
  setupContextMenus() {
    try {
      chrome.contextMenus.create({
        id: 'analyze-pr-tests',
        title: 'Analyze Tests for PR',
        contexts: ['page'],
        documentUrlPatterns: [
          'https://github.com/*/pull/*',
          'https://gitlab.com/*/merge_requests/*',
          'https://gitlab.com/*/-/merge_requests/*',
          'https://bitbucket.org/*/pull-requests/*'
        ]
      });

      chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'analyze-pr-tests' && tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'triggerAnalysis'
          });
        }
      });

      logger.debug('Context menus setup complete');
    } catch (error) {
      logger.warn('Context menus not available:', error.message);
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(request, sender) {
    const { action, data } = request;
    
    logger.debug('Handling message:', { action, hasData: !!data });

    switch (action) {
      case MESSAGE_TYPES.ANALYZE_PR:
        return this.handleAnalyzePR(data);
      
      case MESSAGE_TYPES.GET_CONFIG:
        return this.handleGetConfig();
      
      case MESSAGE_TYPES.SAVE_CONFIG:
        return this.handleSaveConfig(data);
      
      case MESSAGE_TYPES.TRIGGER_JENKINS:
        return this.handleTriggerJenkins(data);
      
      case MESSAGE_TYPES.GET_STATS:
        return this.handleGetStats();
      
      case MESSAGE_TYPES.CLEAR_HISTORY:
        return this.handleClearHistory();
      
      case MESSAGE_TYPES.TEST_CONNECTION:
        return this.handleTestConnection(data);
      
      default:
        logger.warn('Unknown message action:', action);
        return { error: 'Unknown action' };
    }
  }

  /**
   * Handle PR analysis request
   */
  async handleAnalyzePR(data) {
    try {
      const { platform, prInfo } = data;
      
      logger.info('Analyzing PR', { platform, prInfo });

      // Fetch PR data from Git platform
      const prData = await this.gitService.fetchPRData(platform, prInfo);
      
      // Analyze tests
      const analysis = await this.testService.identifyTests(prData);
      
      // Save to history
      await this.saveToHistory({
        platform,
        prInfo,
        analysis,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        prData,
        analysis
      };
    } catch (error) {
      logger.error('PR analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle get configuration request
   */
  async handleGetConfig() {
    return {
      success: true,
      config: this.config
    };
  }

  /**
   * Handle save configuration request
   */
  async handleSaveConfig(data) {
    try {
      const { config } = data;
      
      // Validate configuration
      const validation = validateConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Save to storage
      await storage.set(STORAGE_KEYS.CONFIG, config);
      
      // Update current config and reinitialize services
      this.config = config;
      this.initializeServices();

      logger.info('Configuration saved successfully');

      return {
        success: true,
        message: 'Configuration saved successfully'
      };
    } catch (error) {
      logger.error('Failed to save configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle Jenkins trigger request
   */
  async handleTriggerJenkins(data) {
    try {
      const { repoUrl, prNumber, testFiles, branch, platform, prInfo } = data;

      logger.info('Triggering Jenkins pipeline', { repoUrl, prNumber });

      const buildInfo = await this.jenkinsService.triggerPipeline({
        repoUrl,
        prNumber,
        testFiles,
        branch,
        coverageThreshold: this.config.analysis?.coverageThreshold || 80
      });

      // Post comment to PR if enabled
      if (this.config.features?.reporting) {
        const comment = this.generateBuildComment(buildInfo, testFiles);
        await this.gitService.postComment(platform, prInfo, comment);
      }

      return {
        success: true,
        buildInfo
      };
    } catch (error) {
      logger.error('Failed to trigger Jenkins:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle get statistics request
   */
  async handleGetStats() {
    try {
      const stats = await storage.getLocal(STORAGE_KEYS.STATS, {
        testsRunToday: 0,
        totalTests: 0,
        successRate: 0,
        avgRuntime: 0
      });

      return {
        success: true,
        stats
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle clear history request
   */
  async handleClearHistory() {
    try {
      await storage.remove(STORAGE_KEYS.HISTORY);
      
      logger.info('History cleared');

      return {
        success: true,
        message: 'History cleared successfully'
      };
    } catch (error) {
      logger.error('Failed to clear history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle test connection request
   */
  async handleTestConnection(data) {
    try {
      const { type } = data;

      let result = false;

      if (type === 'jenkins') {
        result = await this.jenkinsService.testConnection();
      } else if (type === 'github') {
        // Test by fetching authenticated user
        result = await this._testGitHubConnection();
      }

      return {
        success: result,
        message: result ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      logger.error('Connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test GitHub connection
   * @private
   */
  async _testGitHubConnection() {
    try {
      const token = this.config.github?.token;
      if (!token) return false;

      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save analysis to history
   * @private
   */
  async saveToHistory(entry) {
    try {
      const history = await storage.getLocal(STORAGE_KEYS.HISTORY, []);
      history.unshift(entry);
      
      // Keep only last 100 entries
      const trimmedHistory = history.slice(0, 100);
      
      await storage.setLocal(STORAGE_KEYS.HISTORY, trimmedHistory);
    } catch (error) {
      logger.error('Failed to save to history:', error);
    }
  }

  /**
   * Generate build comment for PR
   * @private
   */
  generateBuildComment(buildInfo, testFiles) {
    const testList = Array.isArray(testFiles) 
      ? testFiles.map(t => `- ${t}`).join('\n')
      : testFiles;

    return `## 🧪 Test Pipeline Triggered

Jenkins build has been started for this PR.

**Build Info:**
- Job: ${buildInfo.jobName}
- Build URL: ${buildInfo.buildUrl}
- Triggered: ${new Date(buildInfo.timestamp).toLocaleString()}

**Tests to Run:**
\`\`\`
${testList}
\`\`\`

---
*Automated by AI-Based Dynamic Test Identifier & Runner*`;
  }
}

// Initialize the background controller
const controller = new BackgroundController();

// Export for testing
export default BackgroundController;
