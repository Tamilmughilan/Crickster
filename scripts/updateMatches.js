const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths configuration
const pythonScriptPath = path.join(__dirname, 'api_retrieval.py');
const publicDir = path.join(__dirname, '..', 'public');
const jsonDestPath = path.join(publicDir, 'matches.json');
const timestampPath = path.join(publicDir, 'matches_last_updated.txt');

// Check if we need to update matches data (weekly)
function shouldUpdateData() {
  // If timestamp file doesn't exist, update is needed
  if (!fs.existsSync(timestampPath)) {
    console.log('🕒 No timestamp file found. Update needed.');
    return true;
  }

  try {
    // Read the timestamp
    const lastUpdated = new Date(fs.readFileSync(timestampPath, 'utf8').trim());
    const now = new Date();
    
    // Calculate days since last update
    const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
    
    console.log(`🕒 Last matches data update was ${daysSinceUpdate} days ago`);
    
    // Update if it's been 7 or more days
    return daysSinceUpdate >= 1;
  } catch (error) {
    console.error(`❌ Error reading timestamp: ${error.message}`);
    // If there's an error reading the timestamp, update to be safe
    return true;
  }
}

// Update the timestamp file
function updateTimestamp() {
  try {
    fs.writeFileSync(timestampPath, new Date().toISOString());
    console.log('✅ Updated timestamp file');
  } catch (error) {
    console.error(`❌ Error updating timestamp: ${error.message}`);
  }
}

// Main function to check and update matches data
function updateMatchesData() {
  console.log('🏏 Checking if cricket matches data needs updating...');
  
  if (!shouldUpdateData()) {
    console.log('✅ Cricket matches data is up to date. Skipping update.');
    return;
  }
  
  console.log('🔄 Running matches update...');
  
  // Make sure the public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Execute Python script
  exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error executing Python script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`⚠️ Python script stderr: ${stderr}`);
    }
    
    console.log(stdout);
    
    // Check if matches.json was successfully created in the public directory
    if (fs.existsSync(jsonDestPath)) {
      console.log(`✅ matches.json successfully created in public directory`);
      
      // Update the timestamp after successful update
      updateTimestamp();
    } else {
      console.error('❌ matches.json was not created in the public directory');
    }
  });
}

// Run the update check when this script is executed
updateMatchesData();

module.exports = updateMatchesData; // Export for use in other files if need   0-pp

