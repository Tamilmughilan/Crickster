// scripts/updateCricketStats.js
const downloadCricketData = require('./downloadCricketData');
const processCricketData = require('./processCricketData');

async function updateStats() {
  try {
    console.log('Starting cricket stats update process...');
    
    // Step 1: Download the latest data
    await downloadCricketData();
    
    // Step 2: Process the data
    processCricketData();
    
    console.log('Cricket stats update completed successfully!');
  } catch (err) {
    console.error('Failed to update cricket stats:', err);
  }
}

// Execute if run directly
if (require.main === module) {
  updateStats();
}

module.exports = updateStats;