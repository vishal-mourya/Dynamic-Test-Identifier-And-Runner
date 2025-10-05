/**
 * Storage Utility
 * Wrapper around Chrome Storage API with error handling and caching
 */

import { createLogger } from './logger.js';

const logger = createLogger('Storage');

class StorageManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get data from storage with optional caching
   * @param {string} key - Storage key
   * @param {Object} options - Options {useCache, defaultValue}
   * @returns {Promise<any>}
   */
  async get(key, options = {}) {
    const { useCache = true, defaultValue = null } = options;

    // Check cache first
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug(`Cache hit for key: ${key}`);
        return cached.value;
      }
      this.cache.delete(key);
    }

    try {
      const result = await chrome.storage.sync.get([key]);
      const value = result[key] !== undefined ? result[key] : defaultValue;
      
      if (useCache) {
        this.cache.set(key, { value, timestamp: Date.now() });
      }
      
      return value;
    } catch (error) {
      logger.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set data in storage and update cache
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<boolean>}
   */
  async set(key, value) {
    try {
      await chrome.storage.sync.set({ [key]: value });
      
      // Update cache
      this.cache.set(key, { value, timestamp: Date.now() });
      
      logger.debug(`Successfully saved ${key} to storage`);
      return true;
    } catch (error) {
      logger.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  }

  /**
   * Remove data from storage and cache
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async remove(key) {
    try {
      await chrome.storage.sync.remove([key]);
      this.cache.delete(key);
      logger.debug(`Successfully removed ${key} from storage`);
      return true;
    } catch (error) {
      logger.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  }

  /**
   * Get data from local storage (for larger data)
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {Promise<any>}
   */
  async getLocal(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      logger.error(`Error getting ${key} from local storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set data in local storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<boolean>}
   */
  async setLocal(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      logger.debug(`Successfully saved ${key} to local storage`);
      return true;
    } catch (error) {
      logger.error(`Error setting ${key} in local storage:`, error);
      return false;
    }
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string|null} key - Specific key or null for all
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      logger.debug(`Cleared cache for key: ${key}`);
    } else {
      this.cache.clear();
      logger.debug('Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const storage = new StorageManager();

export default StorageManager;
