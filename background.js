// Background service worker for Dynamic Test Runner
class TestAnalyzer {
  constructor() {
    this.config = null;
    this.init();
  }

  async init() {
    try {
      await this.loadConfig();
      this.setupMessageListeners();
      this.setupContextMenus();
    } catch (error) {
      // Initialization error - extension will still work with basic functionality
      this.config = this.getDefaultConfig();
    }
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['testRunnerConfig']);
      this.config = result.testRunnerConfig || this.getDefaultConfig();
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      jenkins: {
        url: '',
        username: '',
        token: '',
        jobName: 'test-runner-pipeline',
        buildToken: ''
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
      testPatterns: {
        javascript: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js', '**/tests/**/*.js'],
        typescript: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts', '**/tests/**/*.ts'],
        java: ['**/src/test/**/*.java', '**/*Test.java', '**/*Tests.java'],
        python: ['**/test_*.py', '**/*_test.py', '**/tests/**/*.py'],
        csharp: ['**/*.Test.cs', '**/*.Tests.cs', '**/test/**/*.cs'],
        go: ['**/*_test.go'],
        php: ['**/tests/**/*.php', '**/*Test.php']
      },
      coverageThreshold: 80,
      maxTestsToRun: 50
    };
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupContextMenus() {
    try {
      if (chrome.contextMenus) {
        chrome.contextMenus.create({
          id: 'analyze-tests',
          title: 'Analyze Tests for PR',
          contexts: ['page'],
          documentUrlPatterns: [
            'https://github.com/*/pull/*',
            'https://gitlab.com/*/merge_requests/*',
            'https://bitbucket.org/*/pull-requests/*'
          ]
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
          if (info.menuItemId === 'analyze-tests') {
            chrome.tabs.sendMessage(tab.id, { action: 'triggerAnalysis' });
          }
        });
      }
    } catch (error) {
      // Context menus not available or permission missing
      // Extension will still work without context menus
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzeTests':
          const analysisResult = await this.analyzeTests(request.prData, request.codeChanges);
          sendResponse(analysisResult);
          break;

        case 'triggerJenkinsPipeline':
          const pipelineResult = await this.triggerJenkinsPipeline(request.prData, request.testFiles);
          sendResponse(pipelineResult);
          break;

        case 'getConfig':
          sendResponse(this.config);
          break;

        case 'updateConfig':
          await this.updateConfig(request.config);
          sendResponse({ success: true });
          break;

        case 'checkPipelineStatus':
          const statusResult = await this.checkPipelineStatus(request.buildNumber);
          sendResponse(statusResult);
          break;

        case 'testJenkinsConnection':
          const testResult = await this.testJenkinsConnection();
          sendResponse(testResult);
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async analyzeTests(prData, codeChanges) {
    // Analyzing tests for PR
    console.log('🔍 Starting analysis for:', prData);
    console.log('🔍 Code changes:', codeChanges);
    console.log('🔍 Current config:', this.config);
    
    try {
      // Validate input data
      if (!prData || !prData.repository) {
        throw new Error('Invalid PR data: missing repository information');
      }
      
      if (!codeChanges || codeChanges.length === 0) {
        console.warn('⚠️ No code changes provided, generating default change');
        codeChanges = [{
          fileName: 'src/main.js',
          fileExtension: 'js',
          changeType: 'modified',
          modifiedFunctions: ['main', 'init'],
          addedLines: [],
          removedLines: []
        }];
      }
      
      // Check if we have GitHub token
      if (!this.config.github.token) {
        console.warn('⚠️ No GitHub token configured');
        console.log('🔍 Available config keys:', Object.keys(this.config));
        console.log('🔍 GitHub config:', this.config.github);
        
        // Try to proceed without token for public repos
        console.log('🔍 Attempting analysis without token for public repository...');
      }
      
      // Get repository structure and find real test files
      console.log('🔍 Getting repository structure...');
      const repoStructure = await this.getRepositoryStructure(prData);
      console.log('🔍 Repository structure:', repoStructure);
      
      console.log('🔍 Finding existing tests...');
      const existingTests = await this.findExistingTests(repoStructure, prData);
      console.log('🔍 Found existing tests:', existingTests);
      
      // Analyze code changes to identify relevant tests
      console.log('🔍 Identifying relevant tests...');
      const relevantTests = this.identifyRelevantTests(codeChanges, existingTests);
      console.log('🔍 Relevant tests:', relevantTests);
      
      // Generate new test suggestions if no tests found
      const suggestedTests = relevantTests.length === 0 ? 
        this.generateTestSuggestions(codeChanges) : [];
      
      // Calculate coverage estimation
      const coverageAnalysis = this.analyzeCoverage(codeChanges, relevantTests);
      
      const result = {
        identifiedTests: relevantTests,
        suggestedTests: suggestedTests,
        coverage: coverageAnalysis,
        totalTests: relevantTests.length,
        estimatedRunTime: this.estimateRunTime(relevantTests),
        repository: prData.repository,
        prNumber: prData.prNumber,
        source: 'real-api'
      };
      
      console.log('✅ Analysis complete:', result);
      return result;
    } catch (error) {
      // Fallback to mock data if API fails
      console.error('❌ API failed, using mock data:', error);
      const mockResult = this.getMockAnalysisResult();
      mockResult.error = error.message;
      return mockResult;
    }
  }

  getMockAnalysisResult() {
    const mockTests = [
      {
        fileName: 'test/example.test.js',
        confidence: 85,
        reason: 'Tests functions modified in PR',
        methods: ['testUserLogin', 'testDataValidation']
      },
      {
        fileName: 'test/integration.test.js', 
        confidence: 70,
        reason: 'Related to modified components',
        methods: ['testAPIEndpoint']
      }
    ];

    return {
      identifiedTests: mockTests,
      suggestedTests: [],
      coverage: { estimatedCoverage: 78, criticalPaths: 2, riskScore: 25 },
      totalTests: mockTests.length,
      estimatedRunTime: '5-10 minutes',
      note: 'Using mock data - configure GitHub token for real analysis'
    };
  }

  async getRepositoryStructure(prData) {
    const { platform, repository } = prData;
    
    try {
      switch (platform) {
        case 'github':
          return await this.getGitHubRepoStructure(repository);
        case 'gitlab':
          return await this.getGitLabRepoStructure(repository);
        case 'bitbucket':
          return await this.getBitbucketRepoStructure(repository);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      // Error getting repository structure
      return { files: [], directories: [] };
    }
  }

  async getGitHubRepoStructure(repository) {
    const token = this.config.github.token;
    console.log('🔍 Fetching GitHub repo structure for:', repository);
    console.log('🔍 Token available:', !!token);
    
    if (!repository || !repository.includes('/')) {
      throw new Error(`Invalid repository format: ${repository}. Expected format: owner/repo`);
    }
    
    // Try main branch first, then master as fallback
    const branches = ['main', 'master'];
    let lastError;
    
    for (const branch of branches) {
      try {
        const url = `https://api.github.com/repos/${repository}/git/trees/${branch}?recursive=1`;
        console.log('🔍 API URL:', url);
        
        const headers = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Dynamic-Test-Runner-Extension/1.0'
        };
        
        if (token) {
          headers['Authorization'] = `token ${token}`;
        }
        
        console.log('🔍 Request headers:', Object.keys(headers));
        
        const response = await fetch(url, { headers });

        console.log('🔍 GitHub API response status:', response.status);
        
        if (response.status === 404 && branch === 'main') {
          console.log('⚠️ Main branch not found, trying master...');
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ GitHub API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorText
          });
          
          if (response.status === 401) {
            throw new Error('GitHub API authentication failed. Please check your token.');
          } else if (response.status === 404) {
            throw new Error(`Repository not found: ${repository}. Check if it exists and is accessible.`);
          } else if (response.status === 403) {
            throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
          }
          
          throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🔍 GitHub API response:', data);
        
        const result = {
          files: data.tree.filter(item => item.type === 'blob').map(item => item.path),
          directories: data.tree.filter(item => item.type === 'tree').map(item => item.path)
        };
        
        console.log('🔍 Processed repository structure:', result);
        return result;
      } catch (error) {
        console.error(`❌ Error with branch ${branch}:`, error);
        lastError = error;
      }
    }
    
    throw lastError || new Error('Failed to fetch repository structure');
  }

  async getGitLabRepoStructure(repository) {
    const token = this.config.gitlab.token;
    if (!token) {
      throw new Error('GitLab token not configured');
    }

    const encodedRepo = encodeURIComponent(repository);
    const response = await fetch(`${this.config.gitlab.apiUrl}/projects/${encodedRepo}/repository/tree?recursive=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      files: data.filter(item => item.type === 'blob').map(item => item.path),
      directories: data.filter(item => item.type === 'tree').map(item => item.path)
    };
  }

  async getBitbucketRepoStructure(repository) {
    const { username, appPassword } = this.config.bitbucket;
    if (!username || !appPassword) {
      throw new Error('Bitbucket credentials not configured');
    }

    const response = await fetch(`${this.config.bitbucket.apiUrl}/repositories/${repository}/src/main/?pagelen=100`, {
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`
      }
    });

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      files: data.values.filter(item => item.type === 'commit_file').map(item => item.path),
      directories: data.values.filter(item => item.type === 'commit_directory').map(item => item.path)
    };
  }

  async findExistingTests(repoStructure, prData) {
    const testFiles = [];
    const { files } = repoStructure;
    
    console.log('🔍 Finding tests in repository structure:');
    console.log('🔍 Total files found:', files.length);
    console.log('🔍 Sample files:', files.slice(0, 10));

    // Load test patterns from config.json
    const testPatterns = await this.loadTestPatterns();
    console.log('🔍 Test patterns loaded:', Object.keys(testPatterns));
    
    // Detect project language
    const languages = this.detectProjectLanguages(files);
    console.log('🔍 Detected languages:', languages);

    languages.forEach(language => {
      const languageConfig = testPatterns[language];
      if (!languageConfig) {
        console.warn(`⚠️ No config found for language: ${language}`);
        return;
      }

      const patterns = languageConfig.patterns || [];
      console.log(`🔍 Testing ${patterns.length} patterns for ${language}:`, patterns);
      
      patterns.forEach(pattern => {
        const regex = this.globToRegex(pattern);
        console.log(`🔍 Pattern: ${pattern} -> Regex: ${regex}`);
        
        let matchCount = 0;
        files.forEach(file => {
          if (regex.test(file)) {
            matchCount++;
            testFiles.push({
              fileName: file,
              language: language,
              framework: languageConfig.frameworks[0] || 'unknown',
              type: this.getTestType(file),
              confidence: this.calculateTestConfidence(file, pattern),
              reason: `Matches ${language} test pattern: ${pattern}`,
              estimatedMethods: this.estimateTestMethods(file)
            });
          }
        });
        console.log(`🔍 Pattern ${pattern} matched ${matchCount} files`);
      });
    });

    console.log('🔍 Total test files found:', testFiles.length);
    console.log('🔍 Test files details:', testFiles);
    
    // If no tests found, try alternative detection methods
    if (testFiles.length === 0) {
      console.log('🔍 No tests found with patterns, trying alternative detection...');
      const alternativeTests = this.findTestsAlternativeMethod(files);
      testFiles.push(...alternativeTests);
      console.log('🔍 Alternative detection found:', alternativeTests.length, 'tests');
    }
    
    return testFiles;
  }

  findTestsAlternativeMethod(files) {
    console.log('🔍 Running alternative test detection...');
    const alternativeTests = [];
    
    // Common test file indicators
    const testIndicators = [
      'test', 'spec', '__tests__', 'tests',
      'Test', 'Spec', 'Tests', 'TESTS'
    ];
    
    files.forEach(file => {
      const fileName = file.toLowerCase();
      const hasTestIndicator = testIndicators.some(indicator => 
        fileName.includes(indicator.toLowerCase())
      );
      
      if (hasTestIndicator) {
        // Additional validation to avoid false positives
        const isLikelyTestFile = 
          fileName.includes('.test.') ||
          fileName.includes('.spec.') ||
          fileName.includes('/test/') ||
          fileName.includes('/tests/') ||
          fileName.includes('__tests__') ||
          fileName.endsWith('test.js') ||
          fileName.endsWith('spec.js') ||
          fileName.endsWith('test.ts') ||
          fileName.endsWith('spec.ts');
          
        if (isLikelyTestFile) {
          alternativeTests.push({
            fileName: file,
            language: this.getLanguageFromFile(file),
            framework: 'unknown',
            type: 'unit',
            confidence: 60,
            reason: 'Alternative detection: contains test indicators',
            estimatedMethods: ['test1', 'test2', 'test3']
          });
        }
      }
    });
    
    return alternativeTests;
  }
  
  getLanguageFromFile(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const extensionMap = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php'
    };
    return extensionMap[extension] || 'unknown';
  }

  async loadTestPatterns() {
    try {
      // In a real implementation, this would load from config.json
      // For now, return the patterns directly
      return {
        javascript: {
          extensions: ["js", "jsx", "mjs"],
          patterns: ["**/*.test.js", "**/*.spec.js", "**/test/**/*.js", "**/tests/**/*.js", "**/__tests__/**/*.js"],
          frameworks: ["jest", "mocha", "jasmine", "vitest"]
        },
        typescript: {
          extensions: ["ts", "tsx"],
          patterns: ["**/*.test.ts", "**/*.spec.ts", "**/test/**/*.ts", "**/tests/**/*.ts", "**/__tests__/**/*.ts"],
          frameworks: ["jest", "mocha", "jasmine", "vitest"]
        },
        python: {
          extensions: ["py"],
          patterns: ["**/test_*.py", "**/*_test.py", "**/tests/**/*.py", "**/test/**/*.py"],
          frameworks: ["pytest", "unittest", "nose2"]
        },
        java: {
          extensions: ["java"],
          patterns: ["**/src/test/**/*.java", "**/*Test.java", "**/*Tests.java", "**/test/**/*.java"],
          frameworks: ["junit", "testng", "spock"]
        }
      };
    } catch (error) {
      console.error('Error loading test patterns:', error);
      return {};
    }
  }

  detectProjectLanguages(files) {
    const languageIndicators = {
      javascript: ['.js', 'package.json', '.jsx'],
      typescript: ['.ts', '.tsx', 'tsconfig.json'],
      java: ['.java', 'pom.xml', 'build.gradle'],
      python: ['.py', 'requirements.txt', 'setup.py', 'pyproject.toml'],
      csharp: ['.cs', '.csproj', '.sln'],
      go: ['.go', 'go.mod'],
      php: ['.php', 'composer.json']
    };

    const detectedLanguages = [];

    Object.entries(languageIndicators).forEach(([language, indicators]) => {
      const hasIndicator = indicators.some(indicator => 
        files.some(file => file.includes(indicator))
      );
      if (hasIndicator) {
        detectedLanguages.push(language);
      }
    });

    return detectedLanguages.length > 0 ? detectedLanguages : ['javascript']; // Default fallback
  }

  globToRegex(glob) {
    // Escape special regex characters except glob patterns
    let regexStr = glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\\\*/g, '\u0001') // Temporarily replace escaped asterisks
      .replace(/\*\*/g, '.*') // ** matches any path including /
      .replace(/\*/g, '[^/]*') // * matches any chars except /
      .replace(/\?/g, '.') // ? matches single char
      .replace(/\u0001/g, '\\*'); // Restore escaped asterisks
    
    const regex = new RegExp(`^${regexStr}$`);
    console.log(`🔍 Glob '${glob}' -> Regex: ${regex}`);
    return regex;
  }

  getTestType(fileName) {
    if (fileName.includes('unit') || fileName.includes('Unit')) return 'unit';
    if (fileName.includes('integration') || fileName.includes('Integration')) return 'integration';
    if (fileName.includes('e2e') || fileName.includes('E2E')) return 'e2e';
    return 'unit'; // Default
  }

  estimateTestMethods(fileName) {
    // Estimate based on file name patterns and common conventions
    const baseEstimate = 5;
    if (fileName.includes('integration')) return baseEstimate * 2;
    if (fileName.includes('e2e')) return baseEstimate * 3;
    return baseEstimate;
  }

  identifyRelevantTests(codeChanges, existingTests) {
    const relevantTests = [];

    codeChanges.forEach(change => {
      const { fileName, modifiedFunctions, fileExtension } = change;
      
      // Find tests that might be related to this file
      existingTests.forEach(test => {
        const confidence = this.calculateTestRelevance(change, test);
        
        if (confidence > 30) { // Minimum confidence threshold
          relevantTests.push({
            fileName: test.fileName,
            confidence: Math.round(confidence),
            methods: test.estimatedMethods || [],
            type: test.type,
            language: test.language,
            relatedFile: fileName,
            reason: this.getRelevanceReason(change, test, confidence)
          });
        }
      });
    });

    // Remove duplicates and sort by confidence
    const uniqueTests = this.removeDuplicateTests(relevantTests);
    return uniqueTests.sort((a, b) => b.confidence - a.confidence).slice(0, this.config.maxTestsToRun);
  }

  calculateTestRelevance(codeChange, testFile) {
    let confidence = 0;
    const { fileName, modifiedFunctions } = codeChange;
    
    // File name similarity
    const codeFileName = fileName.split('/').pop().split('.')[0];
    const testFileName = testFile.fileName.split('/').pop();
    
    if (testFileName.toLowerCase().includes(codeFileName.toLowerCase())) {
      confidence += 50;
    }
    
    // Directory structure similarity
    const codeDir = fileName.split('/').slice(0, -1).join('/');
    const testDir = testFile.fileName.split('/').slice(0, -1).join('/');
    
    if (testDir.includes(codeDir) || codeDir.includes(testDir)) {
      confidence += 30;
    }
    
    // Function name matching (if available)
    modifiedFunctions.forEach(func => {
      if (testFileName.toLowerCase().includes(func.toLowerCase())) {
        confidence += 20;
      }
    });
    
    // Language matching
    if (this.getLanguageFromExtension(codeChange.fileExtension) === testFile.language) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100); // Cap at 100%
  }

  getLanguageFromExtension(extension) {
    const extensionMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'java': 'java',
      'py': 'python',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php'
    };
    return extensionMap[extension] || 'unknown';
  }

  getRelevanceReason(codeChange, testFile, confidence) {
    if (confidence >= 70) return 'High similarity in file names and structure';
    if (confidence >= 50) return 'Moderate similarity in naming patterns';
    if (confidence >= 30) return 'Potential relationship based on directory structure';
    return 'Low confidence match';
  }

  removeDuplicateTests(tests) {
    const seen = new Set();
    return tests.filter(test => {
      const key = test.fileName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  generateTestSuggestions(codeChanges) {
    const suggestions = [];

    codeChanges.forEach(change => {
      const { fileName, modifiedFunctions, changeType } = change;
      
      if (changeType === 'added' || changeType === 'modified') {
        modifiedFunctions.forEach(func => {
          suggestions.push({
            type: 'unit',
            description: `Test for ${func} in ${fileName}`,
            priority: 'high',
            template: this.generateTestTemplate(func, fileName)
          });
        });
      }
    });

    return suggestions;
  }

  generateTestTemplate(functionName, fileName) {
    const language = this.getLanguageFromExtension(fileName.split('.').pop());
    
    switch (language) {
      case 'javascript':
        return `describe('${functionName}', () => {
  it('should handle normal case', () => {
    // Test implementation
  });
  
  it('should handle edge cases', () => {
    // Test implementation
  });
});`;

      case 'python':
        return `def test_${functionName}_normal_case():
    # Test implementation
    pass

def test_${functionName}_edge_cases():
    # Test implementation
    pass`;

      case 'java':
        return `@Test
public void test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}NormalCase() {
    // Test implementation
}

@Test
public void test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}EdgeCases() {
    // Test implementation
}`;

      default:
        return `// Test template for ${functionName}
// Add appropriate test cases here`;
    }
  }

  analyzeCoverage(codeChanges, relevantTests) {
    const totalChangedLines = codeChanges.reduce((sum, change) => 
      sum + change.addedLines.length + change.removedLines.length, 0);
    
    // Calculate coverage based on changed files vs test files
    const totalChangedFiles = codeChanges.length;
    const testFilesCount = relevantTests.length;
    
    // More realistic coverage calculation
    let estimatedCoverage = 0;
    if (totalChangedFiles > 0) {
      // Base coverage: percentage of changed files that have corresponding tests
      const filesCovered = Math.min(testFilesCount, totalChangedFiles);
      estimatedCoverage = Math.round((filesCovered / totalChangedFiles) * 100);
      
      // Bonus for having more comprehensive tests
      if (testFilesCount > totalChangedFiles) {
        const bonus = Math.min(20, (testFilesCount - totalChangedFiles) * 5);
        estimatedCoverage = Math.min(95, estimatedCoverage + bonus);
      }
    }

    const criticalPaths = codeChanges.filter(change => 
      change.modifiedFunctions.some(func => 
        ['main', 'init', 'constructor', 'setup'].includes(func.toLowerCase())
      )
    ).length;

    const riskScore = Math.max(0, Math.min(100, 100 - estimatedCoverage + (criticalPaths * 10)));

    return {
      estimated: estimatedCoverage,
      criticalPaths: criticalPaths,
      riskScore: riskScore,
      totalChangedLines: totalChangedLines,
      totalChangedFiles: totalChangedFiles,
      testFilesCount: testFilesCount,
      testCoverage: estimatedCoverage >= 80 ? 'Excellent' : 
                   estimatedCoverage >= 60 ? 'Good' : 
                   estimatedCoverage >= 40 ? 'Fair' : 'Poor'
    };
  }

  estimateRunTime(tests) {
    // Estimate based on test types and count
    const baseTime = 2; // minutes per test
    const typeMultipliers = {
      unit: 1,
      integration: 2,
      e2e: 5
    };

    const totalTime = tests.reduce((sum, test) => {
      const multiplier = typeMultipliers[test.type] || 1;
      return sum + (baseTime * multiplier);
    }, 0);

    return `${Math.round(totalTime)} minutes`;
  }

  async triggerJenkinsPipeline(prData, testFiles) {
    console.log('🚀 Starting Jenkins pipeline trigger...');
    console.log('🚀 PR Data:', prData);
    console.log('🚀 Test Files:', testFiles);
    
    // Using Jenkins buildByToken plugin for triggering
    const jenkinsConfig = {
      baseUrl: 'https://jenkins.clma.coupadev.com',
      jobName: 'Dynamic_Test_Identifier_And_Runner',
      token: '11fa3420985bc0e43bb5f0c5fdea2cabc2'
    };
    
    console.log('🚀 Using Jenkins buildByToken config:', {
      baseUrl: jenkinsConfig.baseUrl,
      jobName: jenkinsConfig.jobName,
      hasToken: !!jenkinsConfig.token
    });

    const buildParameters = {
      REPO_URL: this.getRepoUrl(prData),
      PR_NUMBER: prData.prNumber,
      TEST_FILES: testFiles.map(t => t.fileName).join(','),
      BRANCH: prData.headBranch || 'main'
    };
    
    console.log('🚀 Build parameters:', buildParameters);

    try {
      // Build the Jenkins buildByToken URL with parameters
      const params = new URLSearchParams({
        job: jenkinsConfig.jobName,
        token: jenkinsConfig.token,
        ...buildParameters
      });
      
      const buildUrl = `${jenkinsConfig.baseUrl}/buildByToken/build?${params.toString()}`;
      
      console.log('🚀 Triggering Jenkins build via buildByToken:', buildUrl.replace(jenkinsConfig.token, '***'));
      
      // Use POST method for triggering the build
      const response = await fetch(buildUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Dynamic-Test-Runner-Extension/1.0'
        }
      });
      
      console.log('🚀 Jenkins response status:', response.status);
      console.log('🚀 Jenkins response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Jenkins API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText.substring(0, 500)
        });
        
        if (response.status === 401) {
          throw new Error('Jenkins authentication failed. Please check your build token.');
        } else if (response.status === 404) {
          throw new Error(`Jenkins job not found: ${jenkinsConfig.jobName}. Please verify the job name.`);
        } else if (response.status === 403) {
          throw new Error('Jenkins access denied. The build token may be invalid or the job is not configured for buildByToken triggers.');
        } else {
          throw new Error(`Jenkins API error: ${response.status} - ${errorText.substring(0, 200)}`);
        }
      }

      console.log('✅ Jenkins build triggered successfully via buildByToken');

      // For buildByToken, we don't get detailed response info, so return a success status
      const result = {
        success: true,
        buildNumber: 'Unknown',
        buildUrl: `${jenkinsConfig.baseUrl}/job/${jenkinsConfig.jobName}/`,
        status: 'triggered',
        message: 'Build triggered successfully via buildByToken'
      };
      
      console.log('✅ Pipeline trigger complete:', result);
      return result;
    } catch (error) {
      console.error('❌ Jenkins pipeline trigger failed:', error);
      
      // Return error in response instead of throwing
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  getRepoUrl(prData) {
    const { platform, repository } = prData;
    switch (platform) {
      case 'github':
        return `https://github.com/${repository}.git`;
      case 'gitlab':
        return `https://gitlab.com/${repository}.git`;
      case 'bitbucket':
        return `https://bitbucket.org/${repository}.git`;
      default:
        return '';
    }
  }

  async monitorBuild(prData, buildNumber) {
    const checkInterval = 30000; // 30 seconds
    const maxChecks = 60; // 30 minutes max
    let checks = 0;

    const monitor = async () => {
      try {
        const status = await this.checkPipelineStatus(buildNumber);
        
        if (status.isComplete) {
          await this.postResultsToPR(prData, status);
          return;
        }

        checks++;
        if (checks < maxChecks) {
          setTimeout(monitor, checkInterval);
        }
      } catch (error) {
        // Error monitoring build
      }
    };

    setTimeout(monitor, checkInterval);
  }

  async checkPipelineStatus(buildNumber) {
    const { jenkins } = this.config;
    
    try {
      const response = await fetch(`${jenkins.url}/job/${jenkins.jobName}/${buildNumber}/api/json`, {
        headers: {
          'Authorization': `Basic ${btoa(`${jenkins.username}:${jenkins.token}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Jenkins API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        buildNumber: buildNumber,
        status: data.result || 'RUNNING',
        isComplete: data.result !== null,
        duration: data.duration,
        url: data.url,
        timestamp: data.timestamp
      };
    } catch (error) {
      throw new Error(`Failed to check pipeline status: ${error.message}`);
    }
  }

  async postResultsToPR(prData, buildStatus) {
    const { platform, repository, prNumber } = prData;
    
    const comment = this.generateResultComment(buildStatus);
    
    try {
      switch (platform) {
        case 'github':
          await this.postGitHubComment(repository, prNumber, comment);
          break;
        case 'gitlab':
          await this.postGitLabComment(repository, prNumber, comment);
          break;
        case 'bitbucket':
          await this.postBitbucketComment(repository, prNumber, comment);
          break;
      }
    } catch (error) {
      // Error posting results to PR
    }
  }

  generateResultComment(buildStatus) {
    const { status, duration, url, buildNumber } = buildStatus;
    const emoji = status === 'SUCCESS' ? '✅' : '❌';
    const statusText = status === 'SUCCESS' ? 'PASSED' : 'FAILED';
    
    return `## ${emoji} Test Results - Build #${buildNumber}

**Status:** ${statusText}
**Duration:** ${Math.round(duration / 1000 / 60)} minutes
**Build URL:** [View Details](${url})

### Summary
The automated test suite has been executed based on the code changes in this PR.

${status === 'SUCCESS' 
  ? '🎉 All identified tests passed successfully!' 
  : '⚠️ Some tests failed. Please review the build logs for details.'}

---
*This comment was automatically generated by Dynamic Test Runner*`;
  }

  async postGitHubComment(repository, prNumber, comment) {
    const token = this.config.github.token;
    
    const response = await fetch(`${this.config.github.apiUrl}/repos/${repository}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: comment })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
  }

  async postGitLabComment(repository, prNumber, comment) {
    const token = this.config.gitlab.token;
    const encodedRepo = encodeURIComponent(repository);
    
    const response = await fetch(`${this.config.gitlab.apiUrl}/projects/${encodedRepo}/merge_requests/${prNumber}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: comment })
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status}`);
    }
  }

  async postBitbucketComment(repository, prNumber, comment) {
    const { username, appPassword } = this.config.bitbucket;
    
    const response = await fetch(`${this.config.bitbucket.apiUrl}/repositories/${repository}/pullrequests/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: { raw: comment } })
    });

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.status}`);
    }
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await chrome.storage.sync.set({ testRunnerConfig: this.config });
  }

  async testJenkinsConnection() {
    console.log('🔧 Testing Jenkins connection...');
    const { jenkins } = this.config;
    
    if (!jenkins.url || !jenkins.username || !jenkins.token) {
      return {
        success: false,
        error: 'Jenkins configuration incomplete',
        details: 'Please configure Jenkins URL, username, and API token'
      };
    }

    try {
      // Test 1: Basic Jenkins API access
      console.log('🔧 Test 1: Basic Jenkins API access');
      const basicResponse = await fetch(`${jenkins.url}/api/json`, {
        headers: {
          'Authorization': `Basic ${btoa(`${jenkins.username}:${jenkins.token}`)}`,
          'Accept': 'application/json'
        }
      });

      console.log('🔧 Basic API response status:', basicResponse.status);
      
      if (!basicResponse.ok) {
        if (basicResponse.status === 401) {
          return {
            success: false,
            error: 'Authentication failed',
            details: 'Invalid username or API token'
          };
        } else if (basicResponse.status === 403) {
          return {
            success: false,
            error: 'Access denied to Jenkins',
            details: 'User has no overall Jenkins access'
          };
        }
      }

      // Test 2: Job-specific access
      console.log('🔧 Test 2: Job access check');
      const jobResponse = await fetch(`${jenkins.url}/job/${jenkins.jobName}/api/json`, {
        headers: {
          'Authorization': `Basic ${btoa(`${jenkins.username}:${jenkins.token}`)}`,
          'Accept': 'application/json'
        }
      });

      console.log('🔧 Job API response status:', jobResponse.status);
      
      if (!jobResponse.ok) {
        if (jobResponse.status === 404) {
          return {
            success: false,
            error: 'Job not found',
            details: `Job "${jenkins.jobName}" does not exist or is not accessible`
          };
        } else if (jobResponse.status === 403) {
          return {
            success: false,
            error: 'Job access denied',
            details: `User "${jenkins.username}" cannot access job "${jenkins.jobName}"`
          };
        }
      }

      // Test 3: Build permissions check
      console.log('🔧 Test 3: Build permissions check');
      const jobData = await jobResponse.json();
      console.log('🔧 Job data:', jobData);

      return {
        success: true,
        message: 'Jenkins connection successful',
        details: {
          jenkinsVersion: basicResponse.headers.get('X-Jenkins') || 'Unknown',
          jobName: jenkins.jobName,
          jobUrl: jobData.url,
          buildable: jobData.buildable,
          permissions: 'Access confirmed'
        }
      };

    } catch (error) {
      console.error('🔧 Jenkins connection test failed:', error);
      return {
        success: false,
        error: 'Connection failed',
        details: error.message
      };
    }
  }

  calculateTestConfidence(fileName, pattern) {
    // Calculate confidence based on file path and pattern match
    let confidence = 50; // Base confidence
    
    if (fileName.includes('.test.') || fileName.includes('.spec.')) confidence += 30;
    if (fileName.includes('/test/') || fileName.includes('/tests/')) confidence += 20;
    if (fileName.includes('__tests__')) confidence += 25;
    if (pattern.includes('**/*.test.') || pattern.includes('**/*.spec.')) confidence += 15;
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  getTestType(fileName) {
    if (fileName.includes('unit')) return 'unit';
    if (fileName.includes('integration')) return 'integration';
    if (fileName.includes('e2e') || fileName.includes('end-to-end')) return 'e2e';
    return 'unit'; // Default
  }

  globToRegex(pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')  // ** matches any path
      .replace(/\*/g, '[^/]*') // * matches any filename chars except /
      .replace(/\?/g, '.')     // ? matches single char
      .replace(/\./g, '\\.');  // Escape dots
    
    return new RegExp(`^${regexPattern}$`);
  }

  identifyRelevantTests(codeChanges, existingTests) {
    const relevantTests = [];
    
    codeChanges.forEach(change => {
      const changedFile = change.file || change.fileName;
      const baseName = changedFile.replace(/\.[^/.]+$/, ''); // Remove extension
      const directory = changedFile.split('/').slice(0, -1).join('/');
      
      existingTests.forEach(test => {
        let confidence = 0;
        let reason = '';
        
        // Direct file name match
        if (test.fileName.includes(baseName)) {
          confidence = 90;
          reason = 'Tests file with same name';
        }
        // Same directory
        else if (test.fileName.includes(directory)) {
          confidence = 70;
          reason = 'Tests in same directory';
        }
        // Related functionality (heuristic)
        else if (this.areFilesRelated(changedFile, test.fileName)) {
          confidence = 60;
          reason = 'Related functionality';
        }
        
        if (confidence > 50) {
          relevantTests.push({
            ...test,
            confidence,
            reason,
            relatedFile: changedFile
          });
        }
      });
    });
    
    // Remove duplicates and sort by confidence
    const uniqueTests = relevantTests.filter((test, index, self) => 
      index === self.findIndex(t => t.fileName === test.fileName)
    );
    
    return uniqueTests.sort((a, b) => b.confidence - a.confidence);
  }

  areFilesRelated(file1, file2) {
    // Simple heuristic to determine if files are related
    const name1 = file1.split('/').pop().replace(/\.[^/.]+$/, '');
    const name2 = file2.split('/').pop().replace(/\.[^/.]+$/, '');
    
    return name1.toLowerCase().includes(name2.toLowerCase()) || 
           name2.toLowerCase().includes(name1.toLowerCase());
  }

  generateTestSuggestions(codeChanges) {
    const suggestions = [];
    
    codeChanges.forEach(change => {
      const fileName = change.file || change.fileName;
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      
      suggestions.push({
        fileName: `${baseName}.test.js`,
        type: 'suggested',
        reason: 'No existing tests found for modified file',
        confidence: 80,
        template: 'unit-test'
      });
    });
    
    return suggestions;
  }


  estimateRunTime(tests) {
    const baseTime = 2; // 2 minutes base
    const timePerTest = 0.5; // 30 seconds per test file
    const totalMinutes = baseTime + (tests.length * timePerTest);
    
    if (totalMinutes < 5) return `${Math.round(totalMinutes)} minutes`;
    if (totalMinutes < 60) return `${Math.round(totalMinutes)} minutes`;
    return `${Math.round(totalMinutes / 60)} hours`;
  }
}

// Initialize the test analyzer
const testAnalyzer = new TestAnalyzer();
