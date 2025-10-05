# 🔍 How Test File Discovery Works

## 📋 **Current Status: Mock + Real Implementation**

The extension now has **both mock data (for testing) and real test discovery** capabilities.

## 🔄 **How It Gets Test Files:**

### **1. Repository Scanning via GitHub API**
```javascript
// Gets all files in the repository
const repoStructure = await this.getRepositoryStructure(prData);
// Returns: { files: ['src/main.js', 'test/main.test.js', ...] }
```

### **2. Language Detection**
```javascript
const languages = this.detectProjectLanguages(files);
// Detects: ['javascript', 'typescript', 'python', etc.]
```

**Detection Rules:**
- **JavaScript**: `.js`, `package.json`, `.jsx` files
- **TypeScript**: `.ts`, `.tsx`, `tsconfig.json` files  
- **Python**: `.py`, `requirements.txt`, `setup.py` files
- **Java**: `.java`, `pom.xml`, `build.gradle` files
- **And more...**

### **3. Test Pattern Matching**
```javascript
const testPatterns = {
  javascript: {
    patterns: [
      "**/*.test.js",     // src/component.test.js
      "**/*.spec.js",     // src/component.spec.js  
      "**/test/**/*.js",  // test/component.js
      "**/tests/**/*.js", // tests/component.js
      "**/__tests__/**/*.js" // src/__tests__/component.js
    ]
  },
  python: {
    patterns: [
      "**/test_*.py",     // test_component.py
      "**/*_test.py",     // component_test.py
      "**/tests/**/*.py"  // tests/component.py
    ]
  }
  // ... more languages
}
```

### **4. Smart Test Identification**
For each changed file in the PR, it finds relevant tests by:

**High Confidence (90%):**
- `src/user.js` → `test/user.test.js` (same name)
- `components/Button.jsx` → `components/Button.spec.jsx`

**Medium Confidence (70%):**
- `src/auth/login.js` → `test/auth/login.test.js` (same directory)

**Low Confidence (60%):**
- `utils/validation.js` → `test/user-validation.test.js` (related names)

## 📊 **What You Get Back:**

```json
{
  "identifiedTests": [
    {
      "fileName": "test/user.test.js",
      "confidence": 90,
      "reason": "Tests file with same name",
      "language": "javascript",
      "framework": "jest",
      "type": "unit",
      "relatedFile": "src/user.js"
    }
  ],
  "suggestedTests": [
    {
      "fileName": "src/newFeature.test.js", 
      "reason": "No existing tests found for modified file",
      "template": "unit-test"
    }
  ],
  "coverage": {
    "estimatedCoverage": 78,
    "criticalPaths": 2,
    "riskScore": 22
  }
}
```

## 🔧 **Configuration Required:**

### **For Real Test Discovery:**
1. **GitHub Token** (in extension popup):
   - Needs `repo` scope to read repository files
   - Used to call GitHub API: `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`

2. **Repository Access**:
   - Token must have access to the repository
   - Works with public and private repos (if token has access)

### **Current Fallback:**
If GitHub API fails (no token, network issues, etc.), it returns mock data with a note:
```json
{
  "note": "Using mock data - configure GitHub token for real analysis"
}
```

## 🎯 **Supported Test Patterns:**

| Language | Extensions | Common Patterns |
|----------|------------|-----------------|
| **JavaScript** | `.js`, `.jsx`, `.mjs` | `*.test.js`, `test/*.js`, `__tests__/*.js` |
| **TypeScript** | `.ts`, `.tsx` | `*.test.ts`, `test/*.ts`, `__tests__/*.ts` |
| **Python** | `.py` | `test_*.py`, `*_test.py`, `tests/*.py` |
| **Java** | `.java` | `*Test.java`, `src/test/**/*.java` |
| **C#** | `.cs` | `*.Test.cs`, `test/*.cs` |
| **Go** | `.go` | `*_test.go` |
| **PHP** | `.php` | `*Test.php`, `tests/*.php` |
| **Ruby** | `.rb` | `*_spec.rb`, `spec/*.rb` |

## 🚀 **To Enable Real Test Discovery:**

1. **Configure GitHub Token:**
   - Extension popup → Config tab
   - Add your GitHub Personal Access Token
   - Save configuration

2. **Test on Real Repository:**
   - Navigate to a GitHub PR
   - Click "Analyze Current PR"
   - Should now scan actual repository files

3. **Verify in Console:**
   - Open browser DevTools (F12)
   - Check console for: "Detected languages: ['javascript']"
   - Check console for: "Found test files: [...]"

## 🔍 **Debug Test Discovery:**

```javascript
// Check what files were found
console.log('Repository files:', repoStructure.files);

// Check detected languages  
console.log('Detected languages:', languages);

// Check matched test files
console.log('Found test files:', testFiles);
```

## 📈 **Future Enhancements:**

1. **More Intelligent Matching:**
   - Parse import statements to find dependencies
   - Analyze function names and exports
   - Use AST parsing for better relationships

2. **Framework-Specific Detection:**
   - Jest configuration parsing
   - Test suite organization
   - Custom test patterns from config files

3. **Performance Optimization:**
   - Cache repository structure
   - Incremental analysis
   - Parallel API calls

---

**The extension now intelligently discovers real test files from your repository! 🎉**
