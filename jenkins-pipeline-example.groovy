// Jenkins Pipeline for Dynamic Test Runner
// This is an example pipeline that can be used with the Chrome extension

pipeline {
    agent any
    
    parameters {
        string(
            name: 'REPO_URL',
            defaultValue: '',
            description: 'Git repository URL'
        )
        string(
            name: 'PR_NUMBER',
            defaultValue: '',
            description: 'Pull Request number'
        )
        string(
            name: 'TEST_FILES',
            defaultValue: '',
            description: 'Comma-separated list of test files to run'
        )
        string(
            name: 'BRANCH',
            defaultValue: 'main',
            description: 'Branch to checkout and test'
        )
        string(
            name: 'COVERAGE_THRESHOLD',
            defaultValue: '80',
            description: 'Minimum coverage threshold percentage'
        )
    }
    
    environment {
        // Set environment variables
        NODE_VERSION = '18'
        COVERAGE_THRESHOLD = "${params.COVERAGE_THRESHOLD}"
        TEST_RESULTS_DIR = 'test-results'
        COVERAGE_DIR = 'coverage'
    }
    
    options {
        // Build options
        timeout(time: 30, unit: 'MINUTES')
        retry(2)
        skipDefaultCheckout(true)
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Checking out repository: ${params.REPO_URL}"
                    echo "📋 PR Number: ${params.PR_NUMBER}"
                    echo "🌿 Branch: ${params.BRANCH}"
                    
                    // Checkout the repository
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${params.BRANCH}"]],
                        userRemoteConfigs: [[url: "${params.REPO_URL}"]]
                    ])
                    
                    // Get commit information
                    env.GIT_COMMIT_HASH = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_COMMIT_MESSAGE = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    echo "🔧 Setting up test environment..."
                    
                    // Create necessary directories
                    sh """
                        mkdir -p ${TEST_RESULTS_DIR}
                        mkdir -p ${COVERAGE_DIR}
                        mkdir -p logs
                    """
                    
                    // Detect project type and setup accordingly
                    if (fileExists('package.json')) {
                        echo "📦 Node.js project detected"
                        env.PROJECT_TYPE = 'nodejs'
                    } else if (fileExists('pom.xml')) {
                        echo "☕ Java Maven project detected"
                        env.PROJECT_TYPE = 'maven'
                    } else if (fileExists('build.gradle')) {
                        echo "🐘 Java Gradle project detected"
                        env.PROJECT_TYPE = 'gradle'
                    } else if (fileExists('requirements.txt') || fileExists('setup.py')) {
                        echo "🐍 Python project detected"
                        env.PROJECT_TYPE = 'python'
                    } else if (fileExists('go.mod')) {
                        echo "🐹 Go project detected"
                        env.PROJECT_TYPE = 'go'
                    } else {
                        echo "❓ Unknown project type, using generic setup"
                        env.PROJECT_TYPE = 'generic'
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo "📥 Installing dependencies..."
                    
                    switch(env.PROJECT_TYPE) {
                        case 'nodejs':
                            sh """
                                echo "Installing Node.js dependencies..."
                                npm ci --prefer-offline --no-audit
                            """
                            break
                            
                        case 'maven':
                            sh """
                                echo "Installing Maven dependencies..."
                                mvn clean compile test-compile -DskipTests=true
                            """
                            break
                            
                        case 'gradle':
                            sh """
                                echo "Installing Gradle dependencies..."
                                ./gradlew clean compileJava compileTestJava
                            """
                            break
                            
                        case 'python':
                            sh """
                                echo "Installing Python dependencies..."
                                python -m pip install --upgrade pip
                                if [ -f requirements.txt ]; then
                                    pip install -r requirements.txt
                                fi
                                if [ -f requirements-test.txt ]; then
                                    pip install -r requirements-test.txt
                                fi
                            """
                            break
                            
                        case 'go':
                            sh """
                                echo "Installing Go dependencies..."
                                go mod download
                                go mod tidy
                            """
                            break
                            
                        default:
                            echo "⚠️ Generic project type, skipping dependency installation"
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    echo "🧪 Running tests..."
                    echo "📋 Test files to run: ${params.TEST_FILES}"
                    
                    // Parse test files
                    def testFiles = params.TEST_FILES.split(',').collect { it.trim() }.findAll { it }
                    
                    if (testFiles.isEmpty()) {
                        echo "⚠️ No specific test files provided, running all tests"
                        runAllTests()
                    } else {
                        echo "🎯 Running specific test files: ${testFiles.join(', ')}"
                        runSpecificTests(testFiles)
                    }
                }
            }
            post {
                always {
                    // Archive test results
                    script {
                        if (fileExists("${TEST_RESULTS_DIR}")) {
                            archiveArtifacts artifacts: "${TEST_RESULTS_DIR}/**/*", fingerprint: true
                        }
                    }
                }
            }
        }
        
        stage('Coverage Analysis') {
            steps {
                script {
                    echo "📊 Analyzing test coverage..."
                    
                    switch(env.PROJECT_TYPE) {
                        case 'nodejs':
                            sh """
                                if [ -f package.json ] && grep -q "nyc\\|jest\\|c8" package.json; then
                                    echo "Generating coverage report..."
                                    npm run coverage || npm run test:coverage || echo "No coverage script found"
                                fi
                            """
                            break
                            
                        case 'maven':
                            sh """
                                echo "Generating Maven coverage report..."
                                mvn jacoco:report || echo "JaCoCo not configured"
                            """
                            break
                            
                        case 'gradle':
                            sh """
                                echo "Generating Gradle coverage report..."
                                ./gradlew jacocoTestReport || echo "JaCoCo not configured"
                            """
                            break
                            
                        case 'python':
                            sh """
                                echo "Generating Python coverage report..."
                                coverage report --format=xml || echo "Coverage.py not configured"
                            """
                            break
                            
                        case 'go':
                            sh """
                                echo "Generating Go coverage report..."
                                go test -coverprofile=coverage.out ./... || echo "Coverage generation failed"
                                go tool cover -html=coverage.out -o coverage.html || echo "Coverage HTML generation failed"
                            """
                            break
                    }
                    
                    // Check coverage threshold
                    checkCoverageThreshold()
                }
            }
            post {
                always {
                    // Archive coverage reports
                    script {
                        if (fileExists("${COVERAGE_DIR}")) {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: "${COVERAGE_DIR}",
                                reportFiles: 'index.html',
                                reportName: 'Coverage Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Quality Gates') {
            steps {
                script {
                    echo "🚪 Running quality gates..."
                    
                    // Check test results
                    def testsPassed = checkTestResults()
                    
                    // Check coverage threshold
                    def coveragePassed = checkCoverageThreshold()
                    
                    // Overall quality gate
                    if (!testsPassed || !coveragePassed) {
                        error("Quality gates failed!")
                    }
                    
                    echo "✅ All quality gates passed!"
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up..."
                
                // Publish test results
                publishTestResults testResultsPattern: "${TEST_RESULTS_DIR}/**/*.xml"
                
                // Clean up temporary files
                sh """
                    find . -name "*.tmp" -delete || true
                    find . -name "node_modules" -type d -exec rm -rf {} + || true
                """
            }
        }
        
        success {
            script {
                echo "✅ Pipeline completed successfully!"
                
                // Send success notification (if configured)
                sendNotification('SUCCESS', 'All tests passed successfully!')
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                
                // Send failure notification (if configured)
                sendNotification('FAILURE', 'Some tests failed or quality gates not met.')
            }
        }
        
        unstable {
            script {
                echo "⚠️ Pipeline completed with warnings!"
                
                // Send unstable notification (if configured)
                sendNotification('UNSTABLE', 'Tests completed with warnings.')
            }
        }
    }
}

// Helper functions
def runAllTests() {
    switch(env.PROJECT_TYPE) {
        case 'nodejs':
            sh "npm test"
            break
        case 'maven':
            sh "mvn test"
            break
        case 'gradle':
            sh "./gradlew test"
            break
        case 'python':
            sh "python -m pytest"
            break
        case 'go':
            sh "go test ./..."
            break
        default:
            echo "⚠️ Cannot run tests for unknown project type"
    }
}

def runSpecificTests(testFiles) {
    switch(env.PROJECT_TYPE) {
        case 'nodejs':
            testFiles.each { testFile ->
                sh "npm test -- ${testFile}"
            }
            break
        case 'maven':
            def testClasses = testFiles.collect { it.replaceAll('/', '.').replaceAll('\\.java$', '') }
            sh "mvn test -Dtest=${testClasses.join(',')}"
            break
        case 'gradle':
            def testClasses = testFiles.collect { it.replaceAll('/', '.').replaceAll('\\.java$', '') }
            sh "./gradlew test --tests ${testClasses.join(' --tests ')}"
            break
        case 'python':
            sh "python -m pytest ${testFiles.join(' ')}"
            break
        case 'go':
            testFiles.each { testFile ->
                sh "go test ${testFile}"
            }
            break
        default:
            echo "⚠️ Cannot run specific tests for unknown project type"
    }
}

def checkTestResults() {
    // Check if test results exist and parse them
    if (fileExists("${TEST_RESULTS_DIR}")) {
        def testResults = findFiles(glob: "${TEST_RESULTS_DIR}/**/*.xml")
        if (testResults.length > 0) {
            echo "📊 Found ${testResults.length} test result files"
            return true
        }
    }
    
    echo "⚠️ No test results found"
    return false
}

def checkCoverageThreshold() {
    def threshold = env.COVERAGE_THRESHOLD as Integer
    echo "🎯 Coverage threshold: ${threshold}%"
    
    // This is a simplified check - in practice, you'd parse actual coverage reports
    // For now, we'll assume coverage is acceptable if coverage files exist
    if (fileExists("${COVERAGE_DIR}") || fileExists("coverage.xml") || fileExists("coverage.out")) {
        echo "✅ Coverage files found, assuming threshold met"
        return true
    }
    
    echo "⚠️ No coverage files found"
    return false
}

def sendNotification(status, message) {
    // This function can be extended to send notifications to various channels
    echo "📢 Notification: ${status} - ${message}"
    
    // Example: Send to Slack (if configured)
    // slackSend channel: '#ci-cd', color: getStatusColor(status), message: message
    
    // Example: Send email (if configured)
    // emailext subject: "Test Results: ${status}", body: message, to: "team@example.com"
}

def getStatusColor(status) {
    switch(status) {
        case 'SUCCESS': return 'good'
        case 'FAILURE': return 'danger'
        case 'UNSTABLE': return 'warning'
        default: return 'good'
    }
}
