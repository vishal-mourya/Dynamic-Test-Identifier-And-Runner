/**
 * Test Pattern Constants
 * Defines test file patterns for various programming languages and frameworks
 */

export const TEST_PATTERNS = {
  javascript: {
    extensions: ['js', 'jsx', 'mjs'],
    patterns: [
      '**/*.test.js',
      '**/*.spec.js',
      '**/test/**/*.js',
      '**/tests/**/*.js',
      '**/__tests__/**/*.js'
    ],
    frameworks: ['jest', 'mocha', 'jasmine', 'vitest']
  },
  typescript: {
    extensions: ['ts', 'tsx'],
    patterns: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**/*.ts',
      '**/tests/**/*.ts',
      '**/__tests__/**/*.ts'
    ],
    frameworks: ['jest', 'mocha', 'jasmine', 'vitest']
  },
  python: {
    extensions: ['py'],
    patterns: [
      '**/test_*.py',
      '**/*_test.py',
      '**/tests/**/*.py',
      '**/test/**/*.py'
    ],
    frameworks: ['pytest', 'unittest', 'nose2']
  },
  java: {
    extensions: ['java'],
    patterns: [
      '**/src/test/**/*.java',
      '**/*Test.java',
      '**/*Tests.java',
      '**/test/**/*.java'
    ],
    frameworks: ['junit', 'testng', 'spock']
  },
  csharp: {
    extensions: ['cs'],
    patterns: [
      '**/*.Test.cs',
      '**/*.Tests.cs',
      '**/test/**/*.cs',
      '**/tests/**/*.cs'
    ],
    frameworks: ['nunit', 'mstest', 'xunit']
  },
  go: {
    extensions: ['go'],
    patterns: ['**/*_test.go'],
    frameworks: ['testing', 'testify', 'ginkgo']
  },
  php: {
    extensions: ['php'],
    patterns: [
      '**/tests/**/*.php',
      '**/*Test.php',
      '**/test/**/*.php'
    ],
    frameworks: ['phpunit', 'pest', 'codeception']
  },
  ruby: {
    extensions: ['rb'],
    patterns: [
      '**/spec/**/*.rb',
      '**/*_spec.rb',
      '**/test/**/*.rb',
      '**/*_test.rb'
    ],
    frameworks: ['rspec', 'minitest', 'test-unit']
  },
  rust: {
    extensions: ['rs'],
    patterns: [
      '**/tests/**/*.rs',
      '**/*_test.rs'
    ],
    frameworks: ['cargo test']
  },
  kotlin: {
    extensions: ['kt', 'kts'],
    patterns: [
      '**/src/test/**/*.kt',
      '**/*Test.kt',
      '**/*Tests.kt'
    ],
    frameworks: ['junit', 'spek', 'kotest']
  }
};

export const FILE_EXTENSIONS = Object.values(TEST_PATTERNS).reduce((acc, lang) => {
  lang.extensions.forEach(ext => {
    if (!acc[ext]) {
      acc[ext] = [];
    }
    acc[ext].push(...lang.patterns);
  });
  return acc;
}, {});
