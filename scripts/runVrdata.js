const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get paths
const scriptDir = __dirname;
const statsDir = path.join(scriptDir, '..', 'public', 'stats');
const lastUpdateFile = path.join(statsDir, 'last_updated.txt');

// Ensure stats directory exists
if (!fs.existsSync(statsDir)) {
  fs.mkdirSync(statsDir, { recursive: true });
}

// Check if we should update (7 days passed)
function shouldUpdate() {
  if (!fs.existsSync(lastUpdateFile)) {
    return true;
  }

  try {
    const lastUpdated = new Date(fs.readFileSync(lastUpdateFile, 'utf8'));
    const daysSinceUpdate = (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate >= 7;
  } catch (error) {
    console.log('Error checking last update time:', error);
    return true; // If there's an error, update anyway
  }
}

// Run the Python script if needed
if (shouldUpdate()) {
  console.log('Starting analysis script (7+ days since last update)...');
  
  // Run the Python script
  const pythonProcess = spawn('python', [path.join(scriptDir, 'analyzeVRData.py')]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Analysis process exited with code ${code}`);
  });
} else {
  console.log('VR data is up to date (last updated less than 7 days ago). Skipping analysis.');
}