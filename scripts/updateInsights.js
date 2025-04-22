const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function updateInsights() {
  console.log('Generating cricket insights...');
  
  const pythonScript = path.join(__dirname, 'visualizations.py');
  
  // Check if script exists
  if (!fs.existsSync(pythonScript)) {
    console.warn(`Python script not found: ${pythonScript}`);
    return;
  }
  
  exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing insights script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Insights script stderr: ${stderr}`);
    }
    
    console.log(stdout);
    console.log('Insights generation completed');
  });
}

// Run if called directly
if (require.main === module) {
  updateInsights();
}

module.exports = updateInsights;