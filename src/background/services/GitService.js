/**
 * Git Service
 * Handles API interactions with Git platforms (GitHub, GitLab, Bitbucket)
 */

import { PLATFORMS, PLATFORM_CONFIG } from '../../shared/constants/platforms.js';
import { createLogger } from '../../shared/utils/logger.js';
import { isValidUrl, isValidToken } from '../../shared/utils/validator.js';

const logger = createLogger('GitService');

class GitService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Fetch PR data from the appropriate platform
   * @param {string} platform - Platform name (github, gitlab, bitbucket)
   * @param {Object} prInfo - PR information {owner, repo, prNumber}
   * @returns {Promise<Object>}
   */
  async fetchPRData(platform, prInfo) {
    logger.info(`Fetching PR data from ${platform}`, prInfo);

    switch (platform) {
      case PLATFORMS.GITHUB:
        return this.fetchGitHubPR(prInfo);
      case PLATFORMS.GITLAB:
        return this.fetchGitLabMR(prInfo);
      case PLATFORMS.BITBUCKET:
        return this.fetchBitbucketPR(prInfo);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Fetch GitHub PR data
   * @private
   */
  async fetchGitHubPR({ owner, repo, prNumber }) {
    const token = this.config.github?.token;
    const apiUrl = this.config.github?.apiUrl || PLATFORM_CONFIG[PLATFORMS.GITHUB].apiUrl;

    if (!token) {
      logger.warn('No GitHub token configured, attempting public access');
    }

    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    try {
      // Fetch PR details
      const prResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/pulls/${prNumber}`, { headers });
      
      if (!prResponse.ok) {
        throw new Error(`GitHub API error: ${prResponse.status} ${prResponse.statusText}`);
      }

      const prData = await prResponse.json();

      // Fetch changed files
      const filesResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files`, { headers });
      const files = await filesResponse.json();

      return {
        platform: PLATFORMS.GITHUB,
        number: prNumber,
        title: prData.title,
        description: prData.body,
        author: prData.user.login,
        branch: prData.head.ref,
        baseBranch: prData.base.ref,
        state: prData.state,
        changedFiles: files.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch
        })),
        url: prData.html_url,
        repository: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`
        }
      };
    } catch (error) {
      logger.error('Error fetching GitHub PR:', error);
      throw error;
    }
  }

  /**
   * Fetch GitLab merge request data
   * @private
   */
  async fetchGitLabMR({ owner, repo, prNumber }) {
    const token = this.config.gitlab?.token;
    const apiUrl = this.config.gitlab?.apiUrl || PLATFORM_CONFIG[PLATFORMS.GITLAB].apiUrl;

    if (!token) {
      throw new Error('GitLab token is required');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const projectPath = encodeURIComponent(`${owner}/${repo}`);

    try {
      const mrResponse = await fetch(`${apiUrl}/projects/${projectPath}/merge_requests/${prNumber}`, { headers });
      
      if (!mrResponse.ok) {
        throw new Error(`GitLab API error: ${mrResponse.status}`);
      }

      const mrData = await mrResponse.json();

      // Fetch changes
      const changesResponse = await fetch(`${apiUrl}/projects/${projectPath}/merge_requests/${prNumber}/changes`, { headers });
      const changes = await changesResponse.json();

      return {
        platform: PLATFORMS.GITLAB,
        number: prNumber,
        title: mrData.title,
        description: mrData.description,
        author: mrData.author.username,
        branch: mrData.source_branch,
        baseBranch: mrData.target_branch,
        state: mrData.state,
        changedFiles: changes.changes.map(file => ({
          filename: file.new_path || file.old_path,
          status: file.new_file ? 'added' : file.deleted_file ? 'deleted' : 'modified',
          diff: file.diff
        })),
        url: mrData.web_url,
        repository: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`
        }
      };
    } catch (error) {
      logger.error('Error fetching GitLab MR:', error);
      throw error;
    }
  }

  /**
   * Fetch Bitbucket pull request data
   * @private
   */
  async fetchBitbucketPR({ owner, repo, prNumber }) {
    const { username, appPassword } = this.config.bitbucket || {};
    const apiUrl = this.config.bitbucket?.apiUrl || PLATFORM_CONFIG[PLATFORMS.BITBUCKET].apiUrl;

    if (!username || !appPassword) {
      throw new Error('Bitbucket credentials are required');
    }

    const headers = {
      'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
      'Content-Type': 'application/json'
    };

    try {
      const prResponse = await fetch(
        `${apiUrl}/repositories/${owner}/${repo}/pullrequests/${prNumber}`,
        { headers }
      );

      if (!prResponse.ok) {
        throw new Error(`Bitbucket API error: ${prResponse.status}`);
      }

      const prData = await prResponse.json();

      // Fetch diff
      const diffResponse = await fetch(
        `${apiUrl}/repositories/${owner}/${repo}/pullrequests/${prNumber}/diff`,
        { headers }
      );
      const diffText = await diffResponse.text();

      return {
        platform: PLATFORMS.BITBUCKET,
        number: prNumber,
        title: prData.title,
        description: prData.description,
        author: prData.author.display_name,
        branch: prData.source.branch.name,
        baseBranch: prData.destination.branch.name,
        state: prData.state,
        changedFiles: this._parseBitbucketDiff(diffText),
        url: prData.links.html.href,
        repository: {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`
        }
      };
    } catch (error) {
      logger.error('Error fetching Bitbucket PR:', error);
      throw error;
    }
  }

  /**
   * Parse Bitbucket diff to extract changed files
   * @private
   */
  _parseBitbucketDiff(diffText) {
    const files = [];
    const filePattern = /diff --git a\/(.*?) b\/(.*?)\n/g;
    let match;

    while ((match = filePattern.exec(diffText)) !== null) {
      files.push({
        filename: match[2],
        status: 'modified'
      });
    }

    return files;
  }

  /**
   * Post comment to PR
   * @param {string} platform - Platform name
   * @param {Object} prInfo - PR information
   * @param {string} comment - Comment text
   * @returns {Promise<boolean>}
   */
  async postComment(platform, prInfo, comment) {
    logger.info(`Posting comment to ${platform} PR`, prInfo);

    try {
      switch (platform) {
        case PLATFORMS.GITHUB:
          return this._postGitHubComment(prInfo, comment);
        case PLATFORMS.GITLAB:
          return this._postGitLabComment(prInfo, comment);
        case PLATFORMS.BITBUCKET:
          return this._postBitbucketComment(prInfo, comment);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      logger.error('Error posting comment:', error);
      return false;
    }
  }

  /**
   * Post GitHub comment
   * @private
   */
  async _postGitHubComment({ owner, repo, prNumber }, comment) {
    const token = this.config.github?.token;
    const apiUrl = this.config.github?.apiUrl || PLATFORM_CONFIG[PLATFORMS.GITHUB].apiUrl;

    if (!token) {
      throw new Error('GitHub token is required to post comments');
    }

    const response = await fetch(
      `${apiUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: comment })
      }
    );

    return response.ok;
  }

  /**
   * Post GitLab comment
   * @private
   */
  async _postGitLabComment({ owner, repo, prNumber }, comment) {
    const token = this.config.gitlab?.token;
    const apiUrl = this.config.gitlab?.apiUrl || PLATFORM_CONFIG[PLATFORMS.GITLAB].apiUrl;

    const projectPath = encodeURIComponent(`${owner}/${repo}`);

    const response = await fetch(
      `${apiUrl}/projects/${projectPath}/merge_requests/${prNumber}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: comment })
      }
    );

    return response.ok;
  }

  /**
   * Post Bitbucket comment
   * @private
   */
  async _postBitbucketComment({ owner, repo, prNumber }, comment) {
    const { username, appPassword } = this.config.bitbucket || {};
    const apiUrl = this.config.bitbucket?.apiUrl || PLATFORM_CONFIG[PLATFORMS.BITBUCKET].apiUrl;

    const response = await fetch(
      `${apiUrl}/repositories/${owner}/${repo}/pullrequests/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: { raw: comment }
        })
      }
    );

    return response.ok;
  }
}

export default GitService;
