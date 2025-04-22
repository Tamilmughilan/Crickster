const express = require('express');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

// Import your update scripts conditionally
let updateCricketStats, updateTeamStats, runLiveScoreScraper, updateInsights, updateCricketNews;

try {
  updateCricketStats = require('./scripts/updateCricketStats');
  updateTeamStats = require('./scripts/update_team_stats');
  runLiveScoreScraper = require('./scripts/run_live_score_scraper');
  updateInsights = require('./scripts/updateInsights');
  updateCricketNews = require('./scripts/updateCricketNews');
} catch (error) {
  console.error('Error importing scripts:', error);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Schedule data updates (daily at midnight)
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled data updates...');
    if (updateCricketStats) updateCricketStats();
    if (updateTeamStats) updateTeamStats();
    if (runLiveScoreScraper) runLiveScoreScraper();
    if (updateInsights) updateInsights();
    if (updateCricketNews) updateCricketNews();
  });
}

// API endpoints
app.get('/api/live-scores', (req, res) => {
  try {
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
      lastUpdated: Math.floor(Date.now() / 1000)
    };
    
    res.json(liveScoresData);
  } catch (error) {
    console.error('Error serving live scores:', error);
    res.status(500).json({ error: 'Failed to retrieve live scores' });
  }
});

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.warn('Warning: Build directory does not exist. Run npm run build first.');
}

// All GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});