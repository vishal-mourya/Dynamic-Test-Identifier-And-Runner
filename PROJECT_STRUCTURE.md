# Project Structure - AI-Based Dynamic Test Identifier & Runner

## 📁 New Modular Architecture

This document outlines the complete project structure following modern software engineering principles.

## Directory Tree

```
ai-based-dynamic-test-identifier-runner/
│
├── src/                                    # Source code (modular architecture)
│   ├── background/                         # Background service worker
│   │   ├── index.js                        # Main entry point
│   │   ├── services/                       # Business logic services
│   │   │   ├── GitService.js               # Git platform API integration
│   │   │   ├── JenkinsService.js           # Jenkins CI/CD integration
│   │   │   └── TestAnalysisService.js      # Test identification logic
│   │   ├── utils/                          # Background-specific utilities
│   │   │   ├── ConfigManager.js            # Configuration management
│   │   │   └── MessageHandler.js           # Message routing
│   │   └── models/                         # Data models
│   │       └── TestPattern.js              # Test pattern model
│   │
│   ├── content/                            # Content scripts
│   │   ├── index.js                        # Main entry point
│   │   ├── analyzers/                      # Analysis logic
│   │   │   ├── PRAnalyzer.js               # PR analysis logic
│   │   │   └── PlatformDetector.js         # Platform detection
│   │   ├── ui/                             # UI components
│   │   │   ├── FAB.js                      # Floating action button
│   │   │   └── ResultsPanel.js             # Results panel
│   │   └── extractors/                     # Platform-specific extractors
│   │       ├── GitHubExtractor.js          # GitHub data extraction
│   │       ├── GitLabExtractor.js          # GitLab data extraction
│   │       └── BitbucketExtractor.js       # Bitbucket data extraction
│   │
│   ├── popup/                              # Extension popup
│   │   ├── index.js                        # Main entry point
│   │   ├── components/                     # UI components
│   │   │   ├── Dashboard.js                # Dashboard view
│   │   │   ├── Configuration.js            # Configuration view
│   │   │   └── History.js                  # History view
│   │   └── managers/                       # State management
│   │       └── PopupManager.js             # Popup state manager
│   │
│   ├── shared/                             # Shared utilities & constants
│   │   ├── config/                         # Configuration
│   │   │   └── defaults.js                 # Default configuration
│   │   ├── utils/                          # Utility functions
│   │   │   ├── logger.js                   # Logging utility
│   │   │   ├── storage.js                  # Storage wrapper
│   │   │   └── validator.js                # Validation functions
│   │   └── constants/                      # Shared constants
│   │       ├── patterns.js                 # Test patterns
│   │       └── platforms.js                # Platform configurations
│   │
│   └── injected/                           # Injected scripts
│       └── index.js                        # Enhanced PR page functionality
│
├── public/                                 # Public assets
│   ├── icons/                              # Extension icons
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── styles/                             # CSS stylesheets
│       ├── popup.css                       # Popup styles
│       └── content.css                     # Content script styles
│
├── docs/                                   # Documentation
│   ├── ARCHITECTURE.md                     # Architecture guide
│   ├── MIGRATION_GUIDE.md                  # Migration from old structure
│   ├── API.md                              # API documentation
│   └── DEVELOPMENT.md                      # Development guide
│
├── scripts/                                # Build & utility scripts
│   ├── build.js                            # Build script
│   ├── test.js                             # Test runner
│   └── validate.js                         # Manifest validator
│
├── legacy/                                 # Legacy files (for reference)
│   ├── background.js                       # Old background script
│   ├── content.js                          # Old content script
│   └── popup.js                            # Old popup script
│
├── manifest.json                           # Chrome extension manifest
├── config.json                             # Static configuration
├── package.json                            # NPM dependencies
├── .gitignore                              # Git ignore rules
├── LICENSE                                 # MIT License
├── README.md                               # Project documentation
├── CONTRIBUTING.md                         # Contribution guidelines
├── CHANGELOG.md                            # Version history
├── DEPLOYMENT.md                           # Deployment guide
├── TROUBLESHOOTING.md                      # Troubleshooting guide
├── PROJECT_SUMMARY.md                      # Project overview
└── QUICK_START.md                          # Quick start guide
```

## 📦 Module Descriptions

### 🔷 Background Modules

#### **services/GitService.js**
- Handles all Git platform API interactions
- Supports GitHub, GitLab, Bitbucket
- Fetches PR data, posts comments
- Manages authentication tokens

#### **services/JenkinsService.js**
- Jenkins CI/CD integration
- Triggers pipeline builds
- Monitors build status
- Posts results to PRs

#### **services/TestAnalysisService.js**
- Identifies relevant test files
- Analyzes code coverage
- Calculates risk scores
- Matches test patterns

#### **utils/ConfigManager.js**
- Configuration persistence
- Validation and sanitization
- Default value management
- Migration handling

#### **utils/MessageHandler.js**
- Routes messages between components
- Handles async responses
- Error propagation
- Message validation

### 🔷 Content Modules

#### **analyzers/PRAnalyzer.js**
- Core PR analysis logic
- Code change detection
- Complexity analysis
- Risk assessment

#### **analyzers/PlatformDetector.js**
- Detects current Git platform
- URL pattern matching
- Platform-specific configuration

#### **ui/FAB.js**
- Floating action button component
- User interaction handling
- Animation and styling
- Tooltip management

#### **ui/ResultsPanel.js**
- Test results display
- Coverage visualization
- Action buttons
- Status updates

#### **extractors/**
- Platform-specific DOM extraction
- Metadata parsing
- Changed files identification
- PR context extraction

### 🔷 Popup Modules

#### **components/Dashboard.js**
- Main dashboard view
- Statistics display
- Quick actions
- Status indicators

#### **components/Configuration.js**
- Settings management UI
- Form validation
- Connection testing
- Save/reset functionality

#### **components/History.js**
- Analysis history view
- Filtering and search
- Export functionality
- Clear history

#### **managers/PopupManager.js**
- Central state management
- Tab navigation
- Data loading
- Event coordination

### 🔷 Shared Modules

#### **config/defaults.js**
- Default configuration values
- Storage keys
- Message type constants
- Feature flags

#### **utils/logger.js**
- Centralized logging
- Log levels (DEBUG, INFO, WARN, ERROR)
- Context-based loggers
- Development mode

#### **utils/storage.js**
- Chrome storage wrapper
- Caching layer
- Error handling
- Sync/local storage support

#### **utils/validator.js**
- Input validation
- URL validation
- Token validation
- Config validation
- Sanitization functions

#### **constants/patterns.js**
- Test file patterns
- Language configurations
- Framework detection
- File extensions

#### **constants/platforms.js**
- Platform configurations
- API URLs
- URL patterns
- Required scopes

## 🎯 Design Principles Applied

### 1. **Single Responsibility**
Each module has one clear purpose:
- `GitService` → Git APIs only
- `Logger` → Logging only
- `Storage` → Data persistence only

### 2. **DRY (Don't Repeat Yourself)**
Common code extracted to shared utilities:
- Validation logic → `validator.js`
- Storage operations → `storage.js`
- Logging → `logger.js`

### 3. **Separation of Concerns**
Clear boundaries between layers:
- **Business Logic** → services/
- **UI Components** → ui/, components/
- **Utilities** → utils/
- **Constants** → constants/

### 4. **Dependency Injection**
Configuration injected into services:
```javascript
const gitService = new GitService(config);
const jenkinsService = new JenkinsService(config);
```

### 5. **Modularity**
- Easy to test individual modules
- Easy to replace implementations
- Easy to add new features
- Easy to maintain

## 🔄 Data Flow

```
┌─────────────┐
│   Content   │ ──── Detects PR ────►
└─────────────┘                      │
                                     ▼
┌─────────────┐              ┌──────────────┐
│    Popup    │ ◄──────────► │  Background  │
└─────────────┘              │   (Services) │
      │                      └──────────────┘
      │                             │
      ▼                             ▼
┌─────────────┐              ┌──────────────┐
│   Storage   │              │  Git/Jenkins │
│             │              │     APIs     │
└─────────────┘              └──────────────┘
```

## 📊 File Statistics

### Code Organization
- **Total Modules**: 25+
- **Shared Utilities**: 6
- **Services**: 3
- **UI Components**: 6
- **Analyzers**: 2
- **Extractors**: 3

### Benefits Achieved
✅ **Reduced Complexity**: Large files split into focused modules  
✅ **Improved Testability**: Each module can be tested independently  
✅ **Better Maintainability**: Changes isolated to specific modules  
✅ **Enhanced Scalability**: Easy to add new features  
✅ **Code Reusability**: Shared utilities used everywhere  
✅ **Clear Architecture**: Obvious where to find/add code  

## 🚀 Development Workflow

### 1. Adding New Feature
```bash
1. Identify appropriate module
2. Create new file in correct directory
3. Import shared utilities
4. Export module
5. Write tests
6. Document
```

### 2. Modifying Existing Feature
```bash
1. Locate module
2. Make changes
3. Update tests
4. Update documentation
5. Verify integration
```

### 3. Debugging
```bash
1. Check logger output
2. Identify module
3. Use browser devtools
4. Test module in isolation
5. Fix and verify
```

## 📚 Related Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed architecture explanation
- **[MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - Migration from old structure
- **[README.md](README.md)** - General project information
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🔧 Build Commands

```bash
npm run build          # Build extension
npm run test           # Run tests
npm run lint           # Lint code
npm run format         # Format code
npm run validate       # Validate manifest
npm run zip            # Create distributable
```

## 📝 Notes

- All old files moved to `legacy/` for reference
- Manifest updated to use new module paths
- ES6 modules enabled in manifest
- Chrome storage API wrapped for better error handling
- All console.log replaced with logger
- Input validation centralized

---

**Architecture Version**: 2.0 (Modular)  
**Last Updated**: 2025-10-05  
**Status**: ✅ Ready for Development
