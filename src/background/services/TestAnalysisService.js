/**
 * Test Analysis Service
 * Identifies relevant test files based on code changes and patterns
 */

import { TEST_PATTERNS } from '../../shared/constants/patterns.js';
import { createLogger } from '../../shared/utils/logger.js';

const logger = createLogger('TestAnalysisService');

class TestAnalysisService {
  constructor(config) {
    this.config = config;
    this.testPatterns = config.testPatterns || TEST_PATTERNS;
  }

  /**
   * Identify test files from changed files
   * @param {Object} prData - PR data with changed files
   * @returns {Promise<Object>} Analysis results
   */
  async identifyTests(prData) {
    logger.info('Analyzing PR for test files', {
      platform: prData.platform,
      changedFiles: prData.changedFiles?.length
    });

    const { changedFiles = [] } = prData;
    
    if (changedFiles.length === 0) {
      logger.warn('No changed files to analyze');
      return {
        identifiedTests: [],
        coverage: 0,
        recommendations: []
      };
    }

    // Identify existing test files
    const existingTests = this._identifyExistingTests(changedFiles);
    
    // Identify source files that need tests
    const sourceFiles = this._identifySourceFiles(changedFiles);
    
    // Find related tests for source files
    const relatedTests = this._findRelatedTests(sourceFiles, changedFiles);
    
    // Calculate coverage
    const coverage = this._calculateCoverage(sourceFiles, relatedTests);
    
    // Generate recommendations
    const recommendations = this._generateRecommendations(sourceFiles, relatedTests);
    
    // Calculate risk scores
    const riskAnalysis = this._analyzeRisk(changedFiles);

    return {
      identifiedTests: [...new Set([...existingTests, ...relatedTests])],
      existingTests,
      relatedTests,
      sourceFiles,
      coverage,
      recommendations,
      riskAnalysis,
      statistics: {
        totalFiles: changedFiles.length,
        sourceFiles: sourceFiles.length,
        testFiles: existingTests.length,
        relatedTests: relatedTests.length
      }
    };
  }

  /**
   * Identify existing test files from changed files
   * @private
   */
  _identifyExistingTests(changedFiles) {
    const testFiles = [];

    for (const file of changedFiles) {
      const filename = file.filename || file.path || '';
      
      if (this._isTestFile(filename)) {
        testFiles.push({
          path: filename,
          type: 'existing',
          language: this._detectLanguage(filename),
          confidence: 1.0,
          reason: 'Direct test file modification'
        });
      }
    }

    logger.debug(`Identified ${testFiles.length} existing test files`);
    return testFiles;
  }

  /**
   * Identify source files (non-test files)
   * @private
   */
  _identifySourceFiles(changedFiles) {
    return changedFiles
      .filter(file => {
        const filename = file.filename || file.path || '';
        return !this._isTestFile(filename) && this._isCodeFile(filename);
      })
      .map(file => ({
        path: file.filename || file.path,
        language: this._detectLanguage(file.filename || file.path),
        additions: file.additions || 0,
        deletions: file.deletions || 0,
        changes: file.changes || 0
      }));
  }

  /**
   * Find related test files for source files
   * @private
   */
  _findRelatedTests(sourceFiles, allFiles) {
    const relatedTests = [];

    for (const sourceFile of sourceFiles) {
      const possibleTestPaths = this._generateTestPaths(sourceFile.path);
      
      // Check if any of the possible test paths exist in changed files
      for (const testPath of possibleTestPaths) {
        if (allFiles.some(f => (f.filename || f.path) === testPath)) {
          relatedTests.push({
            path: testPath,
            type: 'related',
            sourceFile: sourceFile.path,
            language: sourceFile.language,
            confidence: 0.9,
            reason: 'Test file for modified source'
          });
        }
      }

      // If no direct test found, suggest potential test files
      if (possibleTestPaths.length > 0) {
        relatedTests.push({
          path: possibleTestPaths[0],
          type: 'suggested',
          sourceFile: sourceFile.path,
          language: sourceFile.language,
          confidence: 0.6,
          reason: 'Suggested test file based on naming convention'
        });
      }
    }

    logger.debug(`Found ${relatedTests.length} related/suggested tests`);
    return relatedTests;
  }

  /**
   * Check if file is a test file
   * @private
   */
  _isTestFile(filename) {
    const lowerFilename = filename.toLowerCase();
    
    // Check against all language patterns
    for (const language in this.testPatterns) {
      const patterns = this.testPatterns[language].patterns || [];
      
      for (const pattern of patterns) {
        // Convert glob pattern to regex
        const regex = this._globToRegex(pattern);
        if (regex.test(filename)) {
          return true;
        }
      }
    }

    // Common test indicators
    return lowerFilename.includes('test') ||
           lowerFilename.includes('spec') ||
           lowerFilename.includes('__tests__');
  }

  /**
   * Check if file is a code file (not config, docs, etc.)
   * @private
   */
  _isCodeFile(filename) {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs',
      '.go', '.php', '.rb', '.rs', '.kt', '.cpp', '.c', '.h'
    ];
    
    const ignoredPaths = [
      'node_modules', 'vendor', 'dist', 'build', '.git',
      'package-lock.json', 'yarn.lock'
    ];

    // Check if in ignored paths
    if (ignoredPaths.some(ignored => filename.includes(ignored))) {
      return false;
    }

    // Check if has code extension
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Detect programming language from filename
   * @private
   */
  _detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    for (const [language, config] of Object.entries(this.testPatterns)) {
      if (config.extensions?.includes(ext)) {
        return language;
      }
    }

    return 'unknown';
  }

  /**
   * Generate possible test file paths for a source file
   * @private
   */
  _generateTestPaths(sourcePath) {
    const paths = [];
    const parts = sourcePath.split('/');
    const filename = parts[parts.length - 1];
    const dir = parts.slice(0, -1).join('/');
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    const ext = filename.split('.').pop();

    // Pattern 1: Same directory with .test or .spec
    paths.push(`${dir}/${nameWithoutExt}.test.${ext}`);
    paths.push(`${dir}/${nameWithoutExt}.spec.${ext}`);

    // Pattern 2: __tests__ directory
    paths.push(`${dir}/__tests__/${filename}`);
    paths.push(`${dir}/__tests__/${nameWithoutExt}.test.${ext}`);

    // Pattern 3: tests or test directory
    paths.push(`${dir}/tests/${filename}`);
    paths.push(`${dir}/test/${filename}`);

    // Pattern 4: Parallel test directory structure
    const srcIndex = parts.indexOf('src');
    if (srcIndex !== -1) {
      const testParts = [...parts];
      testParts[srcIndex] = 'test';
      paths.push(testParts.join('/'));
      
      testParts[srcIndex] = 'tests';
      paths.push(testParts.join('/'));
    }

    return paths;
  }

  /**
   * Calculate test coverage percentage
   * @private
   */
  _calculateCoverage(sourceFiles, relatedTests) {
    if (sourceFiles.length === 0) return 100;

    const testedFiles = relatedTests.filter(t => t.type === 'related').length;
    const coverage = (testedFiles / sourceFiles.length) * 100;

    return Math.round(coverage);
  }

  /**
   * Generate test recommendations
   * @private
   */
  _generateRecommendations(sourceFiles, relatedTests) {
    const recommendations = [];
    const testedPaths = new Set(relatedTests.map(t => t.sourceFile));

    for (const sourceFile of sourceFiles) {
      if (!testedPaths.has(sourceFile.path)) {
        recommendations.push({
          type: 'missing_test',
          severity: sourceFile.changes > 50 ? 'high' : 'medium',
          file: sourceFile.path,
          message: `No test file found for ${sourceFile.path}`,
          suggestion: `Create test at: ${this._generateTestPaths(sourceFile.path)[0]}`
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze risk of changes
   * @private
   */
  _analyzeRisk(changedFiles) {
    let totalRisk = 0;
    const risks = [];

    for (const file of changedFiles) {
      const changes = file.changes || (file.additions || 0) + (file.deletions || 0);
      let risk = 0;

      // Risk factors
      if (changes > 100) risk += 30;
      else if (changes > 50) risk += 20;
      else if (changes > 10) risk += 10;

      if (!this._isTestFile(file.filename || file.path)) {
        risk += 10; // Source files without tests are riskier
      }

      if (risk > 0) {
        risks.push({
          file: file.filename || file.path,
          risk: Math.min(risk, 100),
          changes
        });
      }

      totalRisk += risk;
    }

    return {
      totalRisk: Math.min(Math.round(totalRisk / changedFiles.length), 100),
      risks: risks.sort((a, b) => b.risk - a.risk)
    };
  }

  /**
   * Convert glob pattern to regex
   * @private
   */
  _globToRegex(pattern) {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    return new RegExp(regexPattern);
  }
}

export default TestAnalysisService;
