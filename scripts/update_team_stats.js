const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to check if we should update data (every 30 days)
function shouldUpdateTeamData() {
  const timestampFile = path.join(__dirname, '..', 'public', 'teamStats', 'last_updated.txt');
  
  if (!fs.existsSync(timestampFile)) {
    return true;
  }
  
  const lastUpdated = new Date(fs.readFileSync(timestampFile, 'utf-8'));
  const daysSinceUpdate = Math.floor((new Date() - lastUpdated) / (1000 * 60 * 60 * 24));
  
  return daysSinceUpdate >= 30;
}

async function runPythonScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath]);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

async function updateTeamStats() {
  try {
    if (shouldUpdateTeamData()) {
      console.log('Starting team data update process...');
      
      // Run the download script
      console.log('Downloading cricsheet data...');
      await runPythonScript(path.join(__dirname, 'downloadTeamData.py'));
      
      // Run the calculate stats script
      console.log('Calculating team statistics...');
      await runPythonScript(path.join(__dirname, 'calculateTeamStats.py'));
      
      console.log('Team data update complete!');
    } else {
      console.log('Team data is up to date. Skipping update.');
    }
  } catch (error) {
    console.error('Error updating team data:', error);
  }
}

// Run the update function if called directly
if (require.main === module) {
  updateTeamStats();
}

module.exports = updateTeamStats;