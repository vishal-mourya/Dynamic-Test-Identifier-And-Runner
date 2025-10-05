# Architecture Documentation

## Overview

The AI-Based Dynamic Test Identifier & Runner follows a modular, scalable architecture based on SOLID principles and separation of concerns. This document outlines the architectural decisions and structure.

## Architecture Principles

### 1. **Single Responsibility Principle (SRP)**
Each module/class has one specific responsibility:
- `GitService` - Handles only Git platform API interactions
- `JenkinsService` - Handles only Jenkins CI/CD operations
- `TestAnalysisService` - Handles only test identification logic
- `StorageManager` - Handles only data persistence

### 2. **Open/Closed Principle (OCP)**
Modules are open for extension but closed for modification:
- New Git platforms can be added by extending `GitService`
- New test patterns can be added via configuration
- New UI components can be added without modifying existing ones

### 3. **Dependency Inversion Principle (DIP)**
High-level modules don't depend on low-level modules:
- Services depend on abstractions (interfaces/contracts)
- Configuration is injected, not hardcoded
- Utilities are shared across all layers

### 4. **Separation of Concerns**
Clear boundaries between different concerns:
- **Background**: Business logic and API interactions
- **Content**: Page analysis and UI injection
- **Popup**: User interface and configuration
- **Shared**: Common utilities and constants

### 5. **Scalability**
The architecture supports:
- Easy addition of new features
- Independent testing of components
- Code reusability across modules
- Performance optimization per module

## Project Structure

```
├── src/                              # Source code
│   ├── background/                   # Background service worker
│   │   ├── index.js                  # Entry point
│   │   ├── services/                 # Business logic services
│   │   │   ├── GitService.js         # Git platform APIs
│   │   │   ├── JenkinsService.js     # Jenkins CI/CD
│   │   │   └── TestAnalysisService.js # Test identification
│   │   ├── utils/                    # Background utilities
│   │   │   ├── ConfigManager.js      # Configuration management
│   │   │   └── MessageHandler.js     # Message routing
│   │   └── models/                   # Data models
│   │       └── TestPattern.js        # Test pattern model
│   │
│   ├── content/                      # Content scripts
│   │   ├── index.js                  # Entry point
│   │   ├── analyzers/                # Analysis logic
│   │   │   ├── PRAnalyzer.js         # PR analysis
│   │   │   └── PlatformDetector.js   # Platform detection
│   │   ├── ui/                       # UI components
│   │   │   ├── FAB.js                # Floating action button
│   │   │   └── ResultsPanel.js       # Results display
│   │   └── extractors/               # Data extractors
│   │       ├── GitHubExtractor.js    # GitHub-specific
│   │       ├── GitLabExtractor.js    # GitLab-specific
│   │       └── BitbucketExtractor.js # Bitbucket-specific
│   │
│   ├── popup/                        # Extension popup
│   │   ├── index.js                  # Entry point
│   │   ├── components/               # UI components
│   │   │   ├── Dashboard.js          # Dashboard view
│   │   │   ├── Configuration.js      # Config view
│   │   │   └── History.js            # History view
│   │   └── managers/                 # State management
│   │       └── PopupManager.js       # Popup state
│   │
│   ├── shared/                       # Shared code
│   │   ├── config/                   # Configuration
│   │   │   └── defaults.js           # Default settings
│   │   ├── utils/                    # Utilities
│   │   │   ├── logger.js             # Logging
│   │   │   ├── storage.js            # Storage wrapper
│   │   │   └── validator.js          # Validation
│   │   └── constants/                # Constants
│   │       ├── patterns.js           # Test patterns
│   │       └── platforms.js          # Platform configs
│   │
│   └── injected/                     # Injected scripts
│       └── index.js                  # Enhanced PR page
│
├── public/                           # Public assets
│   ├── icons/                        # Extension icons
│   └── styles/                       # CSS stylesheets
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # This file
│   ├── API.md                        # API documentation
│   └── DEVELOPMENT.md                # Development guide
│
└── scripts/                          # Build/utility scripts
    ├── build.js                      # Build script
    └── test.js                       # Test runner
```

## Module Descriptions

### Background Service Worker

**Purpose**: Handles all API interactions, business logic, and background tasks.

**Key Components**:
- **GitService**: Git platform API wrapper (GitHub, GitLab, Bitbucket)
- **JenkinsService**: Jenkins CI/CD integration
- **TestAnalysisService**: Test identification and analysis logic
- **ConfigManager**: Configuration persistence and retrieval
- **MessageHandler**: Inter-component communication routing

**Responsibilities**:
- Fetch PR data from Git platforms
- Trigger Jenkins pipelines
- Analyze code changes
- Store and retrieve configuration
- Handle messages from content/popup scripts

### Content Scripts

**Purpose**: Analyze PR pages and inject UI elements.

**Key Components**:
- **PRAnalyzer**: Core PR analysis logic
- **PlatformDetector**: Detect current Git platform
- **FAB**: Floating action button component
- **ResultsPanel**: Test results display component
- **Platform Extractors**: Platform-specific data extraction

**Responsibilities**:
- Detect when user is on a PR page
- Extract PR metadata from DOM
- Display analysis UI
- Show test results
- Trigger analysis from page context

### Popup Interface

**Purpose**: User interaction and configuration management.

**Key Components**:
- **PopupManager**: Central state management
- **Dashboard**: Main view with statistics
- **Configuration**: Settings management
- **History**: Past analysis history

**Responsibilities**:
- Display extension status
- Allow configuration changes
- Show usage statistics
- Trigger manual analysis
- Display history

### Shared Modules

**Purpose**: Common functionality used across all components.

**Key Components**:
- **Logger**: Centralized logging with levels
- **Storage**: Chrome storage wrapper with caching
- **Validator**: Input validation and sanitization
- **Constants**: Shared constants and patterns

**Responsibilities**:
- Provide consistent logging
- Handle data persistence
- Validate user input
- Define shared constants

## Data Flow

### PR Analysis Flow

```
1. User navigates to PR page
   ↓
2. Content Script detects platform
   ↓
3. PRAnalyzer extracts PR metadata
   ↓
4. Message sent to Background
   ↓
5. GitService fetches full PR data
   ↓
6. TestAnalysisService identifies tests
   ↓
7. Results sent back to Content
   ↓
8. ResultsPanel displays findings
   ↓
9. User triggers Jenkins pipeline
   ↓
10. JenkinsService starts build
    ↓
11. Results posted back to PR
```

### Configuration Flow

```
1. User opens popup
   ↓
2. PopupManager loads config from Storage
   ↓
3. User modifies settings
   ↓
4. Validation performed
   ↓
5. Config saved to Storage
   ↓
6. Background receives update message
   ↓
7. Services reload configuration
```

## Communication Patterns

### Message Passing

All components communicate via Chrome's message passing API:

```javascript
// From Content to Background
chrome.runtime.sendMessage({
  action: 'analyzePR',
  data: prInfo
}, response => {
  // Handle response
});

// From Background to Content
chrome.tabs.sendMessage(tabId, {
  action: 'showResults',
  data: results
});
```

### Event-Driven Architecture

Components emit and listen to events:

```javascript
// Emit event
this.emit('testsIdentified', { tests, coverage });

// Listen to event
this.on('testsIdentified', data => {
  // Handle event
});
```

## Error Handling Strategy

### Graceful Degradation

1. **No Configuration**: Extension works with limited functionality
2. **API Failures**: Show user-friendly error messages
3. **Network Issues**: Retry with exponential backoff
4. **Invalid Data**: Validate and sanitize all inputs

### Error Logging

```javascript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed:', error);
  // Show user notification
  // Log to storage for debugging
}
```

## Performance Optimization

### Caching Strategy

1. **Configuration**: Cached for 5 minutes
2. **PR Data**: Cached per PR URL
3. **Test Patterns**: Loaded once at startup

### Lazy Loading

- UI components loaded on demand
- Platform extractors loaded when needed
- Heavy computations run in background

### Resource Management

- Debounce user input events
- Throttle API calls
- Clean up event listeners
- Cancel pending requests on navigation

## Security Considerations

### Input Validation

All user inputs are validated:
- URL format validation
- Token format validation
- File path sanitization
- XSS prevention

### Secure Storage

- Tokens stored in Chrome's encrypted storage
- No sensitive data in logs
- API calls over HTTPS only

### Content Security Policy

Strict CSP in manifest:
- No eval()
- No inline scripts
- External resources whitelisted

## Testing Strategy

### Unit Tests

Each module has unit tests:
- Services tested independently
- Utilities tested with various inputs
- Validators tested with edge cases

### Integration Tests

Test module interactions:
- Background ↔ Content communication
- API integrations
- Storage operations

### End-to-End Tests

Test complete workflows:
- PR analysis flow
- Configuration changes
- Jenkins triggering

## Extensibility

### Adding New Platforms

1. Add platform constants to `platforms.js`
2. Implement extractor in `content/extractors/`
3. Add API methods to `GitService`
4. Update URL patterns in manifest

### Adding New Test Patterns

1. Add patterns to `patterns.js`
2. Update configuration schema
3. Add detection logic in `TestAnalysisService`

### Adding New Features

1. Create new service/component
2. Add message types to constants
3. Implement message handlers
4. Add UI components if needed

## Deployment

### Build Process

```bash
npm run build          # Build extension
npm run zip           # Create distributable
npm run validate      # Validate manifest
```

### Environment Configuration

- Development: Full logging enabled
- Production: Minimal logging
- Debug: Verbose logging with console groups

## Maintenance

### Code Quality

- ESLint for code style
- Prettier for formatting
- JSDoc comments for documentation
- Regular dependency updates

### Monitoring

- Error logging to storage
- Usage analytics (local only)
- Performance metrics
- API rate limit tracking

## Future Enhancements

### Planned Improvements

1. **Microservices Architecture**: Split services further
2. **WebWorkers**: Move heavy computations
3. **IndexedDB**: For larger data storage
4. **Service Worker Caching**: Offline support
5. **GraphQL Support**: For GitHub API v4

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-05  
**Author**: Development Team
