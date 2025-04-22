// scripts/run_live_score_scraper.js
const { updateLiveScores } = require('./liveScoreScraper');
const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Starting live score update...');
updateLiveScores()
  .then(result => {
    console.log(`Live scores updated: ${result.matches.length} matches found`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error updating live scores:', error);
    process.exit(1);
  });