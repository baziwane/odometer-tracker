#!/usr/bin/env node
/**
 * Generate PWA icons from SVG
 *
 * To use this script:
 * 1. npm install sharp
 * 2. node scripts/generate-icons.js
 *
 * Or generate icons manually:
 * - Go to https://realfavicongenerator.net/
 * - Upload public/icon.svg
 * - Download and extract to public/
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, '../public/icon.svg');
    const svg = fs.readFileSync(svgPath);

    // Generate 192x192
    await sharp(svg)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, '../public/icon-192.png'));
    console.log('Generated icon-192.png');

    // Generate 512x512
    await sharp(svg)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../public/icon-512.png'));
    console.log('Generated icon-512.png');

    // Generate favicon
    await sharp(svg)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.png'));
    console.log('Generated favicon.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Sharp not installed. Run: npm install sharp');
      console.log('Or generate icons manually from public/icon.svg');
    } else {
      throw error;
    }
  }
}

generateIcons();
