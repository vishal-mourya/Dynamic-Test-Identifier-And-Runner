# Source Code Directory

This directory contains the modular, scalable source code for the AI-Based Dynamic Test Identifier & Runner extension.

## 📁 Structure Overview

```
src/
├── background/       # Background service worker
├── content/          # Content scripts  
├── popup/            # Popup interface
├── shared/           # Shared utilities
└── injected/         # Injected scripts
```

## 🎯 Quick Navigation

### Need to modify Git API interactions?
→ `background/services/GitService.js`

### Need to modify Jenkins integration?
→ `background/services/JenkinsService.js`

### Need to modify test identification logic?
→ `background/services/TestAnalysisService.js`

### Need to modify PR page UI?
→ `content/ui/`

### Need to add validation?
→ `shared/utils/validator.js`

### Need to add logging?
→ `shared/utils/logger.js`

### Need to modify configuration?
→ `shared/config/defaults.js`

### Need to add test patterns?
→ `shared/constants/patterns.js`

## 📦 Module Dependencies

```
background/
  ├── depends on: shared/{utils, config, constants}
  └── provides: API services, business logic

content/
  ├── depends on: shared/{utils, constants}
  └── provides: PR analysis, UI components

popup/
  ├── depends on: shared/{utils, config}
  └── provides: User interface, configuration

shared/
  ├── depends on: nothing (self-contained)
  └── provides: utilities, constants, defaults
```

## 🔄 Import Patterns

### Importing from Shared
```javascript
// From background/
import { logger } from '../shared/utils/logger.js';

// From content/
import { PLATFORMS } from '../shared/constants/platforms.js';

// From popup/
import { storage } from '../shared/utils/storage.js';
```

### Importing from Same Directory
```javascript
// From background/index.js
import GitService from './services/GitService.js';
```

### Importing from Subdirectory
```javascript
// From content/index.js
import PRAnalyzer from './analyzers/PRAnalyzer.js';
```

## 🛠️ Development Guidelines

### Adding New Service
1. Create file in appropriate `services/` directory
2. Import required shared utilities
3. Implement service class
4. Export as default or named export
5. Add JSDoc comments
6. Write unit tests

Example:
```javascript
/**
 * New Service
 * Description of what this service does
 */

import { createLogger } from '../../shared/utils/logger.js';
import { storage } from '../../shared/utils/storage.js';

const logger = createLogger('NewService');

class NewService {
  constructor(config) {
    this.config = config;
    logger.info('NewService initialized');
  }

  async doSomething() {
    // Implementation
  }
}

export default NewService;
```

### Adding New Utility
1. Create file in `shared/utils/`
2. Implement pure functions (no side effects)
3. Export individual functions
4. Add comprehensive JSDoc
5. Write unit tests

Example:
```javascript
/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string}
 */
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

### Adding New Constant
1. Add to appropriate file in `shared/constants/`
2. Use uppercase with underscores
3. Group related constants
4. Export as named export

Example:
```javascript
export const API_TIMEOUTS = {
  DEFAULT: 5000,
  LONG: 30000,
  SHORT: 2000
};
```

## 🧪 Testing

### Unit Testing Services
```javascript
import GitService from '../src/background/services/GitService.js';

describe('GitService', () => {
  it('should fetch PR data', async () => {
    const service = new GitService(mockConfig);
    const data = await service.fetchPRData('github', mockPRInfo);
    expect(data).toBeDefined();
  });
});
```

### Testing Utilities
```javascript
import { isValidUrl } from '../src/shared/utils/validator.js';

describe('Validator', () => {
  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});
```

## 📊 Code Quality Standards

### Required Elements
- ✅ JSDoc comments for all public functions
- ✅ Error handling for all async operations
- ✅ Input validation for all external inputs
- ✅ Logging for important operations
- ✅ Consistent naming conventions

### Naming Conventions
- **Classes**: PascalCase (`GitService`, `PRAnalyzer`)
- **Functions**: camelCase (`fetchPRData`, `isValidUrl`)
- **Constants**: UPPER_SNAKE_CASE (`PLATFORMS`, `API_TIMEOUTS`)
- **Files**: PascalCase for classes, camelCase for utilities

### Error Handling
```javascript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed:', error);
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

### Async/Await
Prefer async/await over promises:
```javascript
// Good ✅
async function fetchData() {
  const data = await api.get('/data');
  return data;
}

// Avoid ❌
function fetchData() {
  return api.get('/data').then(data => data);
}
```

## 🔍 Debugging

### Enable Debug Logging
```javascript
import { backgroundLogger } from '../shared/utils/logger.js';

backgroundLogger.setDevelopmentMode(true);
backgroundLogger.debug('Detailed debug info', data);
```

### Check Module Loading
1. Open Chrome DevTools
2. Go to Sources tab
3. Check for module load errors
4. Verify imports resolve correctly

### Test Individual Modules
```javascript
// In browser console
import('./src/shared/utils/validator.js').then(module => {
  console.log('Validator loaded:', module);
  console.log('Test:', module.isValidUrl('https://test.com'));
});
```

## 📚 Additional Documentation

- **[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - Full architecture documentation
- **[../docs/MIGRATION_GUIDE.md](../docs/MIGRATION_GUIDE.md)** - Migration guide
- **[../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** - Complete project structure
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

## 🤝 Need Help?

1. Check existing module implementations
2. Review architecture documentation
3. Check migration guide for examples
4. Open an issue on GitHub
5. Refer to inline JSDoc comments

---

**Version**: 2.0 (Modular Architecture)  
**Last Updated**: 2025-10-05
