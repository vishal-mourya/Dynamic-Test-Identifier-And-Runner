# Migration Guide: From Monolithic to Modular Architecture

This guide helps you understand the transition from the old structure to the new modular architecture.

## Overview of Changes

### Old Structure (Monolithic)
```
├── background.js       # ~1200 lines, everything mixed
├── content.js          # ~700 lines, UI + logic mixed  
├── popup.js            # ~500 lines, all popup code
├── injected.js         # Standalone
├── manifest.json       # Pointing to root files
└── config.json         # Static configuration
```

### New Structure (Modular)
```
├── src/
│   ├── background/     # Separated services
│   ├── content/        # Separated UI + logic
│   ├── popup/          # Separated components
│   ├── shared/         # Common utilities
│   └── injected/       # Moved to src
├── public/             # Static assets
├── docs/               # Documentation
└── scripts/            # Build scripts
```

## Key Architectural Changes

### 1. Separation of Concerns

**Before**: All code in single files
```javascript
// background.js had everything
class TestAnalyzer {
  // Config management
  // API calls
  // Test analysis
  // Message handling
  // All mixed together
}
```

**After**: Separated into focused modules
```javascript
// src/background/services/GitService.js
class GitService {
  // ONLY Git API interactions
}

// src/background/services/TestAnalysisService.js
class TestAnalysisService {
  // ONLY test analysis logic
}

// src/background/utils/ConfigManager.js
class ConfigManager {
  // ONLY configuration management
}
```

### 2. Shared Utilities

**Before**: Duplicated code across files
```javascript
// Same validation logic in multiple files
function isValidUrl(url) { /*...*/ }
// Duplicated in background.js, popup.js, content.js
```

**After**: Centralized utilities
```javascript
// src/shared/utils/validator.js
export const isValidUrl = (url) => { /*...*/ };
// Imported wherever needed
```

### 3. Constants Management

**Before**: Hardcoded values
```javascript
const GITHUB_API = 'https://api.github.com';
// Repeated everywhere
```

**After**: Centralized constants
```javascript
// src/shared/constants/platforms.js
export const PLATFORM_CONFIG = {
  github: {
    apiUrl: 'https://api.github.com',
    // All config in one place
  }
};
```

### 4. Error Handling

**Before**: Inconsistent error handling
```javascript
try {
  // operation
} catch (error) {
  console.log('Error:', error); // Different everywhere
}
```

**After**: Centralized logger
```javascript
import { logger } from '../../shared/utils/logger.js';

try {
  // operation
} catch (error) {
  logger.error('Operation failed:', error); // Consistent
}
```

### 5. Storage Management

**Before**: Direct Chrome API calls
```javascript
chrome.storage.sync.get(['config'], result => {
  // Handle result
  // Repeated everywhere
});
```

**After**: Storage wrapper with caching
```javascript
import { storage } from '../../shared/utils/storage.js';

const config = await storage.get('config', { useCache: true });
// Caching, error handling built-in
```

## Module-by-Module Changes

### Background Service

#### Old Approach
```javascript
// background.js - Single 1200 line file
class TestAnalyzer {
  async analyzePR() {
    // Git API calls
    // Test pattern matching
    // Jenkins triggering
    // All in one method
  }
}
```

#### New Approach
```javascript
// src/background/index.js - Orchestrator
import GitService from './services/GitService.js';
import TestAnalysisService from './services/TestAnalysisService.js';
import JenkinsService from './services/JenkinsService.js';

class BackgroundController {
  constructor() {
    this.gitService = new GitService(config);
    this.testService = new TestAnalysisService(config);
    this.jenkinsService = new JenkinsService(config);
  }

  async analyzePR(prInfo) {
    const prData = await this.gitService.fetchPRData(prInfo);
    const tests = await this.testService.identifyTests(prData);
    return { prData, tests };
  }
}
```

#### Benefits
- ✅ Each service has single responsibility
- ✅ Services can be tested independently
- ✅ Easy to add new Git platforms
- ✅ Configuration injected, not hardcoded

### Content Script

#### Old Approach
```javascript
// content.js - Mixed UI and logic
class PRAnalyzer {
  createUI() {
    // 100+ lines of HTML string
    // Mixed with logic
  }

  analyzeTests() {
    // Analysis logic
    // UI updates
    // All mixed
  }
}
```

#### New Approach
```javascript
// src/content/index.js
import PRAnalyzer from './analyzers/PRAnalyzer.js';
import FAB from './ui/FAB.js';
import ResultsPanel from './ui/ResultsPanel.js';

class ContentController {
  constructor() {
    this.analyzer = new PRAnalyzer();
    this.fab = new FAB();
    this.panel = new ResultsPanel();
  }

  async analyze() {
    const data = await this.analyzer.extractPRData();
    this.panel.showResults(data);
  }
}
```

#### Benefits
- ✅ UI separated from logic
- ✅ Components reusable
- ✅ Easier to test
- ✅ Cleaner code organization

### Popup Interface

#### Old Approach
```javascript
// popup.js - All in one
class PopupManager {
  // Dashboard code
  // Config code
  // History code
  // All mixed together
}
```

#### New Approach
```javascript
// src/popup/index.js
import Dashboard from './components/Dashboard.js';
import Configuration from './components/Configuration.js';
import History from './components/History.js';

class PopupController {
  constructor() {
    this.dashboard = new Dashboard();
    this.config = new Configuration();
    this.history = new History();
  }
}
```

#### Benefits
- ✅ Tab components separated
- ✅ Each component self-contained
- ✅ State management centralized
- ✅ Easier to add new views

## Configuration Changes

### Old Configuration
```json
// config.json - Static file
{
  "extension": {
    "name": "...",
    "version": "..."
  },
  "testPatterns": { /* huge object */ }
}
```

### New Configuration
```javascript
// src/shared/config/defaults.js - Modular
export const DEFAULT_CONFIG = {
  jenkins: { /* ... */ },
  github: { /* ... */ },
  // Organized by concern
};

// src/shared/constants/patterns.js - Separated
export const TEST_PATTERNS = {
  javascript: { /* ... */ },
  python: { /* ... */ },
  // Just patterns
};
```

### Benefits
- ✅ Configuration by module
- ✅ Constants separated
- ✅ Type-safe imports
- ✅ Tree-shaking possible

## Manifest Changes

### Old Manifest
```json
{
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "js": ["content.js"]
  }]
}
```

### New Manifest
```json
{
  "background": {
    "service_worker": "src/background/index.js",
    "type": "module"
  },
  "content_scripts": [{
    "js": ["src/content/index.js"],
    "type": "module"
  }]
}
```

### Benefits
- ✅ ES6 modules supported
- ✅ Import/export statements
- ✅ Better code splitting
- ✅ Modern JavaScript features

## Migration Steps

### Step 1: Update Imports

**Old Code**:
```javascript
// No imports, everything global
```

**New Code**:
```javascript
import { PLATFORMS } from '../../shared/constants/platforms.js';
import { logger } from '../../shared/utils/logger.js';
import { storage } from '../../shared/utils/storage.js';
```

### Step 2: Use Shared Utilities

**Old Code**:
```javascript
// Copy-pasted validation
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

**New Code**:
```javascript
import { isValidUrl } from '../../shared/utils/validator.js';

if (isValidUrl(url)) {
  // Use validated URL
}
```

### Step 3: Replace Direct API Calls

**Old Code**:
```javascript
const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${pr}`);
const data = await response.json();
```

**New Code**:
```javascript
import GitService from './services/GitService.js';

const gitService = new GitService(config);
const prData = await gitService.fetchPRData('github', { owner, repo, pr });
```

### Step 4: Use Logger

**Old Code**:
```javascript
console.log('Analyzing PR...');
console.error('Error:', error);
```

**New Code**:
```javascript
import { logger } from '../shared/utils/logger.js';

logger.info('Analyzing PR...');
logger.error('Error occurred:', error);
```

### Step 5: Update Storage Calls

**Old Code**:
```javascript
chrome.storage.sync.get(['config'], result => {
  const config = result.config || defaultConfig;
});
```

**New Code**:
```javascript
import { storage } from '../shared/utils/storage.js';

const config = await storage.get('config', { 
  defaultValue: defaultConfig,
  useCache: true 
});
```

## Testing the Migration

### 1. Verify Module Loading
```javascript
// Check console for import errors
logger.info('Module loaded successfully');
```

### 2. Test Each Service
```javascript
// Test GitService
const gitService = new GitService(config);
const prData = await gitService.fetchPRData('github', prInfo);
console.assert(prData !== null, 'PR data should be fetched');
```

### 3. Test Integration
```javascript
// Test full flow
const result = await analyzePR(prInfo);
console.assert(result.tests.length > 0, 'Should identify tests');
```

## Backward Compatibility

The old files are still present for reference:
- `background.js` → Reference for migrating background logic
- `content.js` → Reference for migrating content logic
- `popup.js` → Reference for migrating popup logic

You can gradually migrate features while keeping the extension functional.

## Troubleshooting

### Module Not Found
```
Error: Cannot find module '../shared/utils/logger.js'
```
**Solution**: Check the relative path. Use correct `../` depth.

### Import/Export Errors
```
Error: Unexpected token 'export'
```
**Solution**: Ensure manifest has `"type": "module"` for service worker.

### Circular Dependencies
```
Error: Circular dependency detected
```
**Solution**: Move shared code to `src/shared/` to break cycles.

## Best Practices

### DO ✅
- Use shared utilities for common operations
- Import constants instead of hardcoding
- Use logger for all console output
- Validate all external input
- Handle errors gracefully
- Write JSDoc comments

### DON'T ❌
- Duplicate code across modules
- Hardcode configuration values
- Use console.log directly
- Skip input validation
- Ignore error handling
- Mix concerns in single file

## Next Steps

1. **Review Architecture**: Read `ARCHITECTURE.md`
2. **Study Services**: Examine service implementations
3. **Understand Flow**: Follow data flow diagrams
4. **Write Tests**: Add unit tests for new modules
5. **Refactor Gradually**: Move code piece by piece
6. **Test Thoroughly**: Verify each migration step

---

**Need Help?** Check the documentation or open an issue on GitHub.
