// generate-icons.js - Updated version
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Check if feviconicon.png exists in current directory
  const inputImage = 'feviconicon.png';
  
  if (!fs.existsSync(inputImage)) {
    console.error('❌ feviconicon.png not found in current directory!');
    console.log('Current directory:', process.cwd());
    console.log('Please make sure feviconicon.png is in this folder.');
    return;
  }
  
  // Create images folder in current directory
  if (!fs.existsSync('images')) {
    fs.mkdirSync('images');
    console.log('✅ Created images folder');
  }
  
  for (const size of sizes) {
    await sharp(inputImage)
      .resize(size, size)
      .png()
      .toFile(`images/icon-${size}x${size}.png`);
    
    console.log(`✅ Generated ${size}x${size} icon`);
  }
  
  console.log('🎉 All icons generated in images/ folder!');
  console.log('📍 Location:', process.cwd() + '\\images\\');
}

generateIcons().catch(console.error);
