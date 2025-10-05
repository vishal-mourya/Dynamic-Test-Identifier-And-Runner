// Manifest validation script
const fs = require('fs');
const path = require('path');

function validateManifest() {
  try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log('🔍 Validating Chrome Extension Manifest...\n');

    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields.join(', '));
      return false;
    }

    // Check manifest version
    if (manifest.manifest_version !== 3) {
      console.warn('⚠️  Using Manifest V2. Consider upgrading to V3 for better future compatibility.');
    }

    // Check permissions
    if (!manifest.permissions || manifest.permissions.length === 0) {
      console.warn('⚠️  No permissions specified. Extension may not function properly.');
    }

    // Check background script
    if (manifest.background) {
      const backgroundScript = manifest.background.service_worker || manifest.background.scripts?.[0];
      if (backgroundScript && !fs.existsSync(path.join(__dirname, backgroundScript))) {
        console.error(`❌ Background script not found: ${backgroundScript}`);
        return false;
      }
    }

    // Check content scripts
    if (manifest.content_scripts) {
      for (const contentScript of manifest.content_scripts) {
        for (const jsFile of contentScript.js || []) {
          if (!fs.existsSync(path.join(__dirname, jsFile))) {
            console.error(`❌ Content script not found: ${jsFile}`);
            return false;
          }
        }
        for (const cssFile of contentScript.css || []) {
          if (!fs.existsSync(path.join(__dirname, cssFile))) {
            console.error(`❌ Content script CSS not found: ${cssFile}`);
            return false;
          }
        }
      }
    }

    // Check popup files
    if (manifest.action?.default_popup) {
      const popupFile = manifest.action.default_popup;
      if (!fs.existsSync(path.join(__dirname, popupFile))) {
        console.error(`❌ Popup file not found: ${popupFile}`);
        return false;
      }
    }

    // Check icons
    if (manifest.icons) {
      for (const [size, iconPath] of Object.entries(manifest.icons)) {
        if (!fs.existsSync(path.join(__dirname, iconPath))) {
          console.warn(`⚠️  Icon not found: ${iconPath} (${size}x${size})`);
        }
      }
    }

    // Check web accessible resources
    if (manifest.web_accessible_resources) {
      for (const resource of manifest.web_accessible_resources) {
        for (const resourcePath of resource.resources || []) {
          if (!fs.existsSync(path.join(__dirname, resourcePath))) {
            console.warn(`⚠️  Web accessible resource not found: ${resourcePath}`);
          }
        }
      }
    }

    console.log('✅ Manifest validation completed successfully!');
    console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);
    console.log(`📝 Description: ${manifest.description}`);
    
    return true;
  } catch (error) {
    console.error('❌ Manifest validation failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  const isValid = validateManifest();
  process.exit(isValid ? 0 : 1);
}

module.exports = validateManifest;
