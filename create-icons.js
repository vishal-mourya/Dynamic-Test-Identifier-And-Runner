// Simple icon creation script
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon and convert to different sizes
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="10" fill="url(#grad1)"/>
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white"/>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create SVG files for different sizes
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svgContent);
  console.log(`Created icon${size}.svg`);
});

console.log('Icons created successfully!');
console.log('Note: For production, convert SVG files to PNG using an online converter or image editing software.');
