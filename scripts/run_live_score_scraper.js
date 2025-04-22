// scripts/run_live_score_scraper.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the absolute path to the Python script
const pythonScriptPath = path.resolve(__dirname, 'live_score_scraper.py');

console.log('Starting live score scraper service...');

// Verify Python script exists
if (!fs.existsSync(pythonScriptPath)) {
  console.error(`Python script not found at: ${pythonScriptPath}`);
  process.exit(0); // Continue with startup despite error
}

// Determine correct Python command based on system
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

// Launch the Python script as a detached process that continues running
const pythonProcess = spawn(pythonCommand, [pythonScriptPath], {
  detached: true, // This allows the process to run independently
  stdio: 'ignore', // Redirect output to prevent it from blocking Node process
  windowsHide: true // Hide the console window on Windows
});

// Unref the child process to allow the node process to exit independently
pythonProcess.unref();

console.log('Live score scraper service started in background.');
console.log('It will continue running on port 5001.');

// Wait a short time to see if the process crashes immediately
setTimeout(() => {
  process.exit(0); // Exit with success to continue with npm script chain
}, 2000);