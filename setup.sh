#!/bin/bash

# Dynamic Test Runner - Setup Script
# This script helps set up the Chrome extension for development

set -e

echo "🚀 Dynamic Test Identifier & Runner - Setup Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 14
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 14 ]; then
            print_warning "Node.js version 14 or higher is recommended"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 14+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if Chrome is installed
check_chrome() {
    if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null || [ -d "/Applications/Google Chrome.app" ]; then
        print_status "Chrome browser detected"
    else
        print_warning "Chrome browser not detected. Please install Google Chrome to use this extension."
    fi
}

# Validate manifest file
validate_manifest() {
    print_info "Validating manifest.json..."
    if [ -f "manifest.json" ]; then
        if node validate-manifest.js; then
            print_status "Manifest validation passed"
        else
            print_error "Manifest validation failed"
            exit 1
        fi
    else
        print_error "manifest.json not found"
        exit 1
    fi
}

# Generate icons
generate_icons() {
    print_info "Generating extension icons..."
    if [ -f "create-icons.js" ]; then
        node create-icons.js
        print_status "Icons generated successfully"
    else
        print_warning "Icon generation script not found"
    fi
}

# Install dependencies (if package.json exists)
install_dependencies() {
    if [ -f "package.json" ]; then
        print_info "Installing development dependencies..."
        if command -v npm &> /dev/null; then
            npm install
            print_status "Dependencies installed"
        else
            print_warning "npm not found, skipping dependency installation"
        fi
    fi
}

# Create directories if they don't exist
create_directories() {
    print_info "Creating necessary directories..."
    
    directories=("icons" "logs" "temp")
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
}

# Check required files
check_required_files() {
    print_info "Checking required files..."
    
    required_files=(
        "manifest.json"
        "background.js"
        "content.js"
        "popup.html"
        "popup.js"
        "popup.css"
        "styles.css"
    )
    
    missing_files=()
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_status "All required files are present"
    else
        print_error "Missing required files: ${missing_files[*]}"
        exit 1
    fi
}

# Display setup instructions
show_instructions() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo ""
    echo "1. Open Google Chrome"
    echo "2. Navigate to chrome://extensions/"
    echo "3. Enable 'Developer mode' (toggle in top-right corner)"
    echo "4. Click 'Load unpacked' button"
    echo "5. Select this directory: $(pwd)"
    echo "6. Pin the extension to your toolbar"
    echo ""
    echo "🔧 Configuration:"
    echo "================"
    echo ""
    echo "1. Click the extension icon in Chrome toolbar"
    echo "2. Go to 'Config' tab"
    echo "3. Configure Jenkins settings:"
    echo "   - Jenkins URL"
    echo "   - Username and API Token"
    echo "   - Job Name"
    echo ""
    echo "4. Add Git platform tokens:"
    echo "   - GitHub Personal Access Token"
    echo "   - GitLab Personal Access Token"
    echo "   - Bitbucket App Password"
    echo ""
    echo "5. Save configuration and test connection"
    echo ""
    echo "📖 Documentation:"
    echo "================"
    echo "- README.md: Complete setup and usage guide"
    echo "- config.json: Default configuration options"
    echo ""
    echo "🐛 Troubleshooting:"
    echo "=================="
    echo "- Check browser console for errors (F12)"
    echo "- Validate manifest: npm run validate"
    echo "- View logs in Chrome extension developer tools"
    echo ""
    echo "Happy testing! 🚀"
}

# Main setup process
main() {
    echo ""
    print_info "Starting setup process..."
    echo ""
    
    check_nodejs
    check_chrome
    create_directories
    check_required_files
    validate_manifest
    generate_icons
    install_dependencies
    
    show_instructions
}

# Run main function
main
