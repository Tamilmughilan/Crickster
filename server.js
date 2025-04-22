const express = require('express');
const path = require('path');
const cron = require('node-cron');

// Import your update scripts
// Note: Let's handle potential import errors gracefully
let updateCricketStats, updateTeamStats, runLiveScoreScraper, updateInsights, updateCricketNews;

try {
  updateCricketStats = require('./scripts/updateCricketStats');
  updateTeamStats = require('./scripts/update_team_stats');
  runLiveScoreScraper = require('./scripts/run_live_score_scraper');
  updateInsights = require('./scripts/updateInsights');
  // Make sure the path matches exactly your file name
  updateCricketNews = require('./scripts/updateCricketNews');
} catch (error) {
  console.error('Error importing scripts:', error);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Schedule data updates (daily at midnight)
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled data updates...');
  if (updateCricketStats) updateCricketStats();
  if (updateTeamStats) updateTeamStats();
  if (runLiveScoreScraper) runLiveScoreScraper();
  if (updateInsights) updateInsights();
  if (updateCricketNews) updateCricketNews();
});

// All GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/live-scores', (req, res) => {
    try {
      // If you have a local file with live scores data, you can read it here
      // const liveScoresData = require('./path/to/live-scores.json');
      
      // For testing purposes, return dummy data
      const liveScoresData = {
        matches: [
          {
            title: "India vs Australia - 1st ODI",
            scores: ["IND: 325/8 (50)", "AUS: 280 (48.3)"],
            status: "India won by 45 runs",
            url: "https://www.cricbuzz.com/match/123456",
            source: "cricbuzz"
          },
          {
            title: "England vs New Zealand - 2nd T20",
            scores: ["ENG: 189/5 (20)", "NZ: 175/9 (20)"],
            status: "England won by 14 runs",
            url: "https://www.espncricinfo.com/match/789012",
            source: "espn"
          }
        ],
        lastUpdated: Math.floor(Date.now() / 1000) // Current timestamp in seconds
      };
      
      res.json(liveScoresData);
    } catch (error) {
      console.error('Error serving live scores:', error);
      res.status(500).json({ error: 'Failed to retrieve live scores' });
    }
  });