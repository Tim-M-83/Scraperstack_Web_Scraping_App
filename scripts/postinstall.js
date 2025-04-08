#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

// Remove quarantine attributes from the app bundle
try {
  const appPath = path.join('/Applications', 'Scraperstack.app');
  execSync(`xattr -cr "${appPath}"`);
  console.log('Successfully removed quarantine attributes from Scraperstack.app');
} catch (error) {
  console.error('Error removing quarantine attributes:', error.message);
}
