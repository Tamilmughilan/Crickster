const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths configuration
const pythonScriptPath = path.join(__dirname, 'cricket_news_fetcher.py');
const publicDir = path.join(__dirname, '..', 'public');
const timestampPath = path.join(publicDir, 'news_last_updated.txt');

// Check if we need to update cricket news data (daily)
function shouldUpdateData() {
  // If timestamp file doesn't exist, update is needed
  if (!fs.existsSync(timestampPath)) {
    console.log('No timestamp file found for cricket news. Update needed.');
    return true;
  }

  try {
    // Read the timestamp
    const lastUpdated = new Date(fs.readFileSync(timestampPath, 'utf8').trim());
    const now = new Date();
    
    // Calculate hours since last update
    const hoursSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60));
    
    console.log(`Last cricket news update was ${hoursSinceUpdate} hours ago`);
    
    // Update if it's been 24 or more hours
    return hoursSinceUpdate >= 24;
  } catch (error) {
    console.error(`Error reading news timestamp: ${error.message}`);
    // If there's an error reading the timestamp, update to be safe
    return true;
  }
}

// Main function to check and update cricket news
function updateCricketNews() {
  console.log('Checking if cricket news needs updating...');
  
  if (!shouldUpdateData()) {
    console.log('Cricket news is up to date. Skipping update.');
    return;
  }
  
  console.log('Running cricket news update...');
  
  // Make sure the public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Execute Python script
  exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    
    console.log(stdout);
    
    // Check if news file was created
    const newsFilePath = path.join(publicDir, 'cricket_news.json');
    if (fs.existsSync(newsFilePath)) {
      console.log(`Cricket news successfully updated at ${newsFilePath}`);
    } else {
      console.error('News file was not created');
    }
  });
}

// Run the update check when this script is executed
updateCricketNews();

module.exports = updateCricketNews; // Export for use in other files if needed