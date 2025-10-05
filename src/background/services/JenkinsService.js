/**
 * Jenkins Service
 * Handles Jenkins CI/CD integration and pipeline triggering
 */

import { createLogger } from '../../shared/utils/logger.js';
import { isValidUrl } from '../../shared/utils/validator.js';

const logger = createLogger('JenkinsService');

class JenkinsService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Trigger Jenkins pipeline with test files
   * @param {Object} params - Pipeline parameters
   * @returns {Promise<Object>} Build information
   */
  async triggerPipeline(params) {
    const { url, username, token, jobName } = this.config.jenkins || {};

    if (!url || !username || !token || !jobName) {
      throw new Error('Jenkins configuration is incomplete');
    }

    if (!isValidUrl(url)) {
      throw new Error('Invalid Jenkins URL');
    }

    logger.info('Triggering Jenkins pipeline', { jobName, params });

    const {
      repoUrl,
      prNumber,
      testFiles,
      branch,
      coverageThreshold = 80
    } = params;

    const buildParams = {
      REPO_URL: repoUrl,
      PR_NUMBER: String(prNumber),
      TEST_FILES: Array.isArray(testFiles) ? testFiles.join(',') : testFiles,
      BRANCH: branch,
      COVERAGE_THRESHOLD: String(coverageThreshold)
    };

    try {
      const response = await this._triggerBuild(url, username, token, jobName, buildParams);
      return response;
    } catch (error) {
      logger.error('Failed to trigger Jenkins pipeline:', error);
      throw error;
    }
  }

  /**
   * Trigger Jenkins build
   * @private
   */
  async _triggerBuild(url, username, token, jobName, params) {
    const buildUrl = `${url}/job/${jobName}/buildWithParameters`;
    
    // Create URL with parameters
    const urlParams = new URLSearchParams(params);
    const fullUrl = `${buildUrl}?${urlParams.toString()}`;

    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`);
    }

    // Get queue item location from response
    const queueLocation = response.headers.get('Location');
    
    logger.info('Build triggered successfully', { queueLocation });

    return {
      success: true,
      queueLocation,
      jobName,
      buildUrl: `${url}/job/${jobName}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get build status
   * @param {string} buildUrl - Build URL
   * @returns {Promise<Object>} Build status
   */
  async getBuildStatus(buildUrl) {
    const { username, token } = this.config.jenkins || {};

    if (!username || !token) {
      throw new Error('Jenkins credentials not configured');
    }

    const apiUrl = `${buildUrl}/api/json`;
    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${token}`)}`,
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch build status: ${response.status}`);
      }

      const data = await response.json();

      return {
        building: data.building,
        result: data.result, // SUCCESS, FAILURE, UNSTABLE, ABORTED
        duration: data.duration,
        timestamp: data.timestamp,
        url: data.url,
        number: data.number
      };
    } catch (error) {
      logger.error('Error fetching build status:', error);
      throw error;
    }
  }

  /**
   * Get build console output
   * @param {string} buildUrl - Build URL
   * @returns {Promise<string>} Console output
   */
  async getBuildConsole(buildUrl) {
    const { username, token } = this.config.jenkins || {};

    const consoleUrl = `${buildUrl}/consoleText`;
    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${token}`)}`
    };

    try {
      const response = await fetch(consoleUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch console: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      logger.error('Error fetching console output:', error);
      throw error;
    }
  }

  /**
   * Test Jenkins connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    const { url, username, token } = this.config.jenkins || {};

    if (!url || !username || !token) {
      return false;
    }

    logger.info('Testing Jenkins connection', { url });

    try {
      const apiUrl = `${url}/api/json`;
      const headers = {
        'Authorization': `Basic ${btoa(`${username}:${token}`)}`,
        'Accept': 'application/json'
      };

      const response = await fetch(apiUrl, { headers });
      
      if (response.ok) {
        logger.info('Jenkins connection successful');
        return true;
      }
      
      logger.warn('Jenkins connection failed:', response.status);
      return false;
    } catch (error) {
      logger.error('Jenkins connection error:', error);
      return false;
    }
  }

  /**
   * Get list of jobs
   * @returns {Promise<Array>} List of Jenkins jobs
   */
  async getJobs() {
    const { url, username, token } = this.config.jenkins || {};

    const apiUrl = `${url}/api/json?tree=jobs[name,url,color]`;
    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${token}`)}`,
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      logger.error('Error fetching Jenkins jobs:', error);
      throw error;
    }
  }

  /**
   * Stop a running build
   * @param {string} buildUrl - Build URL
   * @returns {Promise<boolean>} Success status
   */
  async stopBuild(buildUrl) {
    const { username, token } = this.config.jenkins || {};

    const stopUrl = `${buildUrl}/stop`;
    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${token}`)}`
    };

    try {
      const response = await fetch(stopUrl, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        logger.info('Build stopped successfully');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error stopping build:', error);
      return false;
    }
  }
}

export default JenkinsService;
