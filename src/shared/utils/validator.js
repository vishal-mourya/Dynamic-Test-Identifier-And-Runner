/**
 * Validator Utility
 * Input validation and sanitization functions
 */

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate token format (not empty and reasonable length)
 * @param {string} token - Token to validate
 * @returns {boolean}
 */
export const isValidToken = (token) => {
  return typeof token === 'string' && token.length >= 10 && token.length <= 500;
};

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} {isValid, errors}
 */
export const validateConfig = (config) => {
  const errors = [];

  // Validate Jenkins config
  if (config.jenkins) {
    if (config.jenkins.url && !isValidUrl(config.jenkins.url)) {
      errors.push('Invalid Jenkins URL format');
    }
    if (config.jenkins.token && !isValidToken(config.jenkins.token)) {
      errors.push('Invalid Jenkins token format');
    }
  }

  // Validate Git platform tokens
  if (config.github?.token && !isValidToken(config.github.token)) {
    errors.push('Invalid GitHub token format');
  }
  if (config.gitlab?.token && !isValidToken(config.gitlab.token)) {
    errors.push('Invalid GitLab token format');
  }

  // Validate numeric thresholds
  if (config.analysis) {
    if (config.analysis.coverageThreshold !== undefined) {
      const coverage = parseInt(config.analysis.coverageThreshold);
      if (isNaN(coverage) || coverage < 0 || coverage > 100) {
        errors.push('Coverage threshold must be between 0 and 100');
      }
    }
    if (config.analysis.maxTestsToRun !== undefined) {
      const maxTests = parseInt(config.analysis.maxTestsToRun);
      if (isNaN(maxTests) || maxTests < 1) {
        errors.push('Max tests to run must be a positive number');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize string input (remove potentially dangerous characters)
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .trim();
};

/**
 * Validate PR number
 * @param {string|number} prNumber - PR number to validate
 * @returns {boolean}
 */
export const isValidPRNumber = (prNumber) => {
  const num = parseInt(prNumber);
  return !isNaN(num) && num > 0;
};

/**
 * Validate test file path
 * @param {string} filePath - File path to validate
 * @returns {boolean}
 */
export const isValidTestFilePath = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return false;
  
  // Should not contain suspicious patterns
  const dangerousPatterns = ['../', '.\\', '<script', 'javascript:'];
  return !dangerousPatterns.some(pattern => filePath.includes(pattern));
};

/**
 * Validate array of test files
 * @param {Array} testFiles - Array of test file paths
 * @returns {Object} {isValid, validFiles, invalidFiles}
 */
export const validateTestFiles = (testFiles) => {
  if (!Array.isArray(testFiles)) {
    return { isValid: false, validFiles: [], invalidFiles: [] };
  }

  const validFiles = [];
  const invalidFiles = [];

  testFiles.forEach(file => {
    if (isValidTestFilePath(file)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  });

  return {
    isValid: invalidFiles.length === 0,
    validFiles,
    invalidFiles
  };
};

export default {
  isValidUrl,
  isValidEmail,
  isValidToken,
  validateConfig,
  sanitizeString,
  isValidPRNumber,
  isValidTestFilePath,
  validateTestFiles
};
