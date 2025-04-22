// scripts/downloadCricketData.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

// Define paths
const DOWNLOAD_URL = 'https://cricsheet.org/downloads/recently_added_7_json.zip';
const DOWNLOAD_PATH = path.join(__dirname, '../public/statsData/recent_matches.zip');
const EXTRACT_PATH = path.join(__dirname, '../public/statsData');

// Ensure directories exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

// Download the file
function downloadFile() {
  return new Promise((resolve, reject) => {
    ensureDirectoryExists(path.dirname(DOWNLOAD_PATH));
    
    console.log(`Downloading cricket data from ${DOWNLOAD_URL}...`);
    const file = fs.createWriteStream(DOWNLOAD_PATH);
    
    https.get(DOWNLOAD_URL, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download completed: ${DOWNLOAD_PATH}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(DOWNLOAD_PATH, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Extract the zip file
function extractZip() {
  try {
    console.log(`Extracting files to ${EXTRACT_PATH}...`);
    const zip = new AdmZip(DOWNLOAD_PATH);
    zip.extractAllTo(EXTRACT_PATH, true);
    console.log('Extraction completed');
  } catch (err) {
    console.error('Error extracting zip file:', err);
    throw err;
  }
}

// Main function
async function main() {
  try {
    await downloadFile();
    extractZip();
    console.log('Cricket data updated successfully!');
  } catch (err) {
    console.error('Failed to update cricket data:', err);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = main;