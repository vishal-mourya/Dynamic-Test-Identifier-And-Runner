/**
 * Default Configuration
 * Central location for all default settings
 */

import { TEST_PATTERNS } from '../constants/patterns.js';

export const DEFAULT_CONFIG = {
  jenkins: {
    url: '',
    username: '',
    token: '',
    jobName: 'test-runner-pipeline',
    buildToken: '',
    timeout: 1800,
    retryAttempts: 3
  },
  github: {
    token: '',
    apiUrl: 'https://api.github.com'
  },
  gitlab: {
    token: '',
    apiUrl: 'https://gitlab.com/api/v4'
  },
  bitbucket: {
    username: '',
    appPassword: '',
    apiUrl: 'https://api.bitbucket.org/2.0'
  },
  testPatterns: TEST_PATTERNS,
  analysis: {
    coverageThreshold: 80,
    maxTestsToRun: 50,
    complexityThreshold: 10,
    riskScoreThreshold: 70
  },
  ui: {
    autoTrigger: false,
    showNotifications: true,
    panelPosition: 'right',
    theme: 'auto'
  },
  features: {
    codeAnalysis: true,
    testGeneration: true,
    reporting: true
  }
};

export const STORAGE_KEYS = {
  CONFIG: 'testRunnerConfig',
  STATS: 'testRunnerStats',
  HISTORY: 'testRunnerHistory',
  CACHE: 'testRunnerCache'
};

export const MESSAGE_TYPES = {
  ANALYZE_PR: 'analyzePR',
  GET_CONFIG: 'getConfig',
  SAVE_CONFIG: 'saveConfig',
  TRIGGER_JENKINS: 'triggerJenkins',
  GET_STATS: 'getStats',
  CLEAR_HISTORY: 'clearHistory',
  TEST_CONNECTION: 'testConnection'
};
