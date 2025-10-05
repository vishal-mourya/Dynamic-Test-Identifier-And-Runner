// Injected script for enhanced PR page interaction
(function() {
  'use strict';

  // Enhanced PR data extraction for different platforms
  class EnhancedPRExtractor {
    constructor() {
      this.platform = this.detectPlatform();
      this.observers = [];
      this.init();
    }

    detectPlatform() {
      const hostname = window.location.hostname;
      if (hostname.includes('github.com')) return 'github';
      if (hostname.includes('gitlab.com')) return 'gitlab';
      if (hostname.includes('bitbucket.org')) return 'bitbucket';
      return 'unknown';
    }

    init() {
      this.setupDOMObservers();
      this.enhancePRInterface();
      this.extractAdvancedMetrics();
    }

    setupDOMObservers() {
      // Observe changes in PR content
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            this.handleDOMChanges(mutation);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      this.observers.push(observer);
    }

    handleDOMChanges(mutation) {
      // Check if new diff content was loaded
      const addedNodes = Array.from(mutation.addedNodes);
      const hasDiffContent = addedNodes.some(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        (node.classList?.contains('diff-table') || 
         node.querySelector?.('.diff-table'))
      );

      if (hasDiffContent) {
        setTimeout(() => this.extractAdvancedMetrics(), 1000);
      }
    }

    enhancePRInterface() {
      // Add test coverage indicators to file headers
      this.addCoverageIndicators();
      
      // Add test suggestion tooltips
      this.addTestSuggestions();
      
      // Highlight critical code sections
      this.highlightCriticalSections();
    }

    addCoverageIndicators() {
      const fileHeaders = document.querySelectorAll('.file-header, .diff-file-header');
      
      fileHeaders.forEach(header => {
        const fileName = this.extractFileNameFromHeader(header);
        if (!fileName) return;

        const coverage = this.estimateFileCoverage(fileName);
        const indicator = this.createCoverageIndicator(coverage);
        
        header.appendChild(indicator);
      });
    }

    extractFileNameFromHeader(header) {
      // Try different selectors based on platform
      const selectors = [
        '.file-info a',
        '.file-title-name',
        '[data-testid="file-path"]',
        '.file-name'
      ];

      for (const selector of selectors) {
        const element = header.querySelector(selector);
        if (element) {
          return element.textContent?.trim();
        }
      }

      return null;
    }

    estimateFileCoverage(fileName) {
      // Simple heuristic for coverage estimation
      const testPatterns = [
        /\.test\./,
        /\.spec\./,
        /test/i,
        /spec/i
      ];

      const isTestFile = testPatterns.some(pattern => pattern.test(fileName));
      if (isTestFile) return 100;

      // Estimate based on file type and common patterns
      const extension = fileName.split('.').pop()?.toLowerCase();
      const coverageMap = {
        'js': 70,
        'ts': 75,
        'jsx': 65,
        'tsx': 70,
        'py': 80,
        'java': 85,
        'cs': 80,
        'go': 75,
        'php': 60
      };

      return coverageMap[extension] || 50;
    }

    createCoverageIndicator(coverage) {
      const indicator = document.createElement('div');
      indicator.className = 'test-coverage-indicator';
      indicator.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-left: 8px;
        background: ${coverage >= 80 ? '#d4edda' : coverage >= 60 ? '#fff3cd' : '#f8d7da'};
        color: ${coverage >= 80 ? '#155724' : coverage >= 60 ? '#856404' : '#721c24'};
        border: 1px solid ${coverage >= 80 ? '#c3e6cb' : coverage >= 60 ? '#ffeaa7' : '#f5c6cb'};
      `;
      
      indicator.innerHTML = `
        <span>📊</span>
        <span>${coverage}% coverage</span>
      `;

      indicator.title = `Estimated test coverage: ${coverage}%`;
      
      return indicator;
    }

    addTestSuggestions() {
      // Add suggestions for functions that might need tests
      const codeLines = document.querySelectorAll('.blob-code-inner, .line_content');
      
      codeLines.forEach(line => {
        const content = line.textContent?.trim();
        if (!content) return;

        if (this.isFunctionDefinition(content)) {
          const suggestion = this.createTestSuggestion(content);
          line.appendChild(suggestion);
        }
      });
    }

    isFunctionDefinition(line) {
      const patterns = [
        /^\s*(public|private|protected)?\s*(static)?\s*(async)?\s*function\s+\w+/i,
        /^\s*(public|private|protected)?\s*(static)?\s*\w+\s*\([^)]*\)\s*{/i,
        /^\s*def\s+\w+/i,
        /^\s*class\s+\w+/i,
        /^\s*interface\s+\w+/i
      ];

      return patterns.some(pattern => pattern.test(line));
    }

    createTestSuggestion(functionLine) {
      const suggestion = document.createElement('span');
      suggestion.className = 'test-suggestion';
      suggestion.style.cssText = `
        display: inline-block;
        margin-left: 8px;
        padding: 2px 6px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      `;
      
      suggestion.textContent = '+ Add Test';
      suggestion.title = 'Click to generate test template';
      
      suggestion.addEventListener('click', () => {
        this.generateTestTemplate(functionLine);
      });

      suggestion.addEventListener('mouseenter', () => {
        suggestion.style.opacity = '1';
      });

      suggestion.addEventListener('mouseleave', () => {
        suggestion.style.opacity = '0.7';
      });

      return suggestion;
    }

    generateTestTemplate(functionLine) {
      const functionName = this.extractFunctionName(functionLine);
      const template = this.createTestTemplate(functionName);
      
      // Copy to clipboard
      navigator.clipboard.writeText(template).then(() => {
        this.showNotification(`Test template for "${functionName}" copied to clipboard!`);
      }).catch(() => {
        this.showTestTemplateModal(template);
      });
    }

    extractFunctionName(line) {
      const patterns = [
        /function\s+(\w+)/i,
        /def\s+(\w+)/i,
        /class\s+(\w+)/i,
        /interface\s+(\w+)/i,
        /(const|let|var)\s+(\w+)/i
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) return match[1] || match[2];
      }

      return 'unknownFunction';
    }

    createTestTemplate(functionName) {
      // Detect language and create appropriate template
      const language = this.detectLanguageFromContext();
      
      switch (language) {
        case 'javascript':
          return `describe('${functionName}', () => {
  it('should handle normal case', () => {
    // Arrange
    
    // Act
    
    // Assert
    expect().toBe();
  });
  
  it('should handle edge cases', () => {
    // Test edge cases
  });
  
  it('should handle error cases', () => {
    // Test error scenarios
  });
});`;

        case 'python':
          return `def test_${functionName}_normal_case():
    """Test ${functionName} with normal inputs."""
    # Arrange
    
    # Act
    
    # Assert
    assert True

def test_${functionName}_edge_cases():
    """Test ${functionName} with edge cases."""
    # Test implementation
    pass

def test_${functionName}_error_cases():
    """Test ${functionName} error handling."""
    # Test implementation
    pass`;

        case 'java':
          return `@Test
public void test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}NormalCase() {
    // Arrange
    
    // Act
    
    // Assert
    assertTrue(true);
}

@Test
public void test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}EdgeCases() {
    // Test edge cases
}

@Test(expected = Exception.class)
public void test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}ErrorCases() {
    // Test error scenarios
}`;

        default:
          return `// Test template for ${functionName}
// TODO: Add appropriate test cases
// 1. Normal case
// 2. Edge cases  
// 3. Error cases`;
      }
    }

    detectLanguageFromContext() {
      // Detect language from file extensions in current PR
      const fileHeaders = document.querySelectorAll('.file-header, .diff-file-header');
      const extensions = new Set();
      
      fileHeaders.forEach(header => {
        const fileName = this.extractFileNameFromHeader(header);
        if (fileName) {
          const ext = fileName.split('.').pop()?.toLowerCase();
          if (ext) extensions.add(ext);
        }
      });

      // Return most common language
      if (extensions.has('js') || extensions.has('jsx')) return 'javascript';
      if (extensions.has('ts') || extensions.has('tsx')) return 'typescript';
      if (extensions.has('py')) return 'python';
      if (extensions.has('java')) return 'java';
      if (extensions.has('cs')) return 'csharp';
      if (extensions.has('go')) return 'go';
      if (extensions.has('php')) return 'php';
      
      return 'javascript'; // Default
    }

    showTestTemplateModal(template) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      modal.innerHTML = `
        <div style="
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80%;
          overflow-y: auto;
        ">
          <h3>Generated Test Template</h3>
          <textarea readonly style="
            width: 100%;
            height: 300px;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
            resize: vertical;
          ">${template}</textarea>
          <div style="margin-top: 15px; text-align: right;">
            <button id="copy-template" style="
              background: #667eea;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              margin-right: 8px;
              cursor: pointer;
            ">Copy</button>
            <button id="close-modal" style="
              background: #ccc;
              color: #333;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Event listeners
      modal.querySelector('#copy-template').addEventListener('click', () => {
        const textarea = modal.querySelector('textarea');
        textarea.select();
        document.execCommand('copy');
        this.showNotification('Template copied to clipboard!');
      });

      modal.querySelector('#close-modal').addEventListener('click', () => {
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    highlightCriticalSections() {
      // Highlight potentially critical code sections
      const codeLines = document.querySelectorAll('.blob-code-inner, .line_content');
      
      codeLines.forEach(line => {
        const content = line.textContent?.trim();
        if (!content) return;

        if (this.isCriticalCode(content)) {
          line.style.background = 'rgba(255, 193, 7, 0.1)';
          line.style.borderLeft = '3px solid #ffc107';
          line.title = 'Critical code section - ensure adequate test coverage';
        }
      });
    }

    isCriticalCode(line) {
      const criticalPatterns = [
        /throw\s+/i,
        /catch\s*\(/i,
        /finally\s*{/i,
        /if\s*\([^)]*null[^)]*\)/i,
        /if\s*\([^)]*undefined[^)]*\)/i,
        /delete\s+/i,
        /eval\s*\(/i,
        /setTimeout\s*\(/i,
        /setInterval\s*\(/i,
        /process\.exit/i,
        /System\.exit/i
      ];

      return criticalPatterns.some(pattern => pattern.test(line));
    }

    extractAdvancedMetrics() {
      // Extract complexity metrics
      const metrics = {
        linesChanged: this.countChangedLines(),
        filesChanged: this.countChangedFiles(),
        complexity: this.estimateComplexity(),
        riskScore: 0
      };

      metrics.riskScore = this.calculateRiskScore(metrics);
      
      // Store metrics for use by the extension
      window.prMetrics = metrics;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('prMetricsUpdated', { detail: metrics }));
    }

    countChangedLines() {
      const addedLines = document.querySelectorAll('.blob-code-addition, .line_content.new').length;
      const removedLines = document.querySelectorAll('.blob-code-deletion, .line_content.old').length;
      return addedLines + removedLines;
    }

    countChangedFiles() {
      return document.querySelectorAll('.file-header, .diff-file-header').length;
    }

    estimateComplexity() {
      let complexity = 0;
      const codeLines = document.querySelectorAll('.blob-code-inner, .line_content');
      
      codeLines.forEach(line => {
        const content = line.textContent?.trim();
        if (!content) return;

        // Count complexity indicators
        const complexityPatterns = [
          /if\s*\(/i,
          /else\s*if/i,
          /while\s*\(/i,
          /for\s*\(/i,
          /switch\s*\(/i,
          /catch\s*\(/i,
          /&&|\|\|/g,
          /\?\s*.*:/g
        ];

        complexityPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            complexity += matches.length;
          }
        });
      });

      return complexity;
    }

    calculateRiskScore(metrics) {
      let risk = 0;
      
      // Lines changed factor
      if (metrics.linesChanged > 500) risk += 30;
      else if (metrics.linesChanged > 200) risk += 20;
      else if (metrics.linesChanged > 50) risk += 10;
      
      // Files changed factor
      if (metrics.filesChanged > 20) risk += 25;
      else if (metrics.filesChanged > 10) risk += 15;
      else if (metrics.filesChanged > 5) risk += 5;
      
      // Complexity factor
      if (metrics.complexity > 50) risk += 25;
      else if (metrics.complexity > 20) risk += 15;
      else if (metrics.complexity > 10) risk += 10;
      
      return Math.min(risk, 100);
    }

    showNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10001;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
      `;
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    cleanup() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers = [];
    }
  }

  // Initialize enhanced extractor
  let enhancedExtractor = null;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhancedExtractor = new EnhancedPRExtractor();
    });
  } else {
    enhancedExtractor = new EnhancedPRExtractor();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (enhancedExtractor) {
      enhancedExtractor.cleanup();
    }
  });

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

})();
