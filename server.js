const express = require('express');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to run scripts via child_process
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Warning from ${scriptPath}: ${stderr}`);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Schedule data updates (daily at midnight)
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled data updates...');
    try {
      await runScript('./scripts/updateCricketStats.js');
      await runScript('./scripts/update_team_stats.js');
      await runScript('./scripts/run_live_score_scraper.js');
      await runScript('./scripts/updateInsights.js');
      await runScript('./scripts/updateCricketNews.js');
      await runScript('./scripts/updateMatches.js');
    } catch (error) {
      console.error('Error running scheduled updates:', error);
    }
  });
}

// API endpoints
app.get('/api/live-scores', (req, res) => {
  try {
    const liveScoresPath = path.join(__dirname, 'public', 'live_scores.json');
    
    // Check if live scores file exists
    if (fs.existsSync(liveScoresPath)) {
      const liveScores = JSON.parse(fs.readFileSync(liveScoresPath, 'utf8'));
      res.json(liveScores);
    } else {
      // Fallback to dummy data
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
    }
  } catch (error) {
    console.error('Error serving live scores:', error);
    res.status(500).json({ error: 'Failed to retrieve live scores' });
  }
});

// Endpoint to manually trigger data updates
app.get('/api/trigger-updates', async (req, res) => {
  try {
    console.log('Manually triggering data updates...');
    
    // Run updates in background
    runScript('./scripts/updateCricketStats.js')
      .catch(err => console.error('Error updating cricket stats:', err));
      
    runScript('./scripts/update_team_stats.js')
      .catch(err => console.error('Error updating team stats:', err));
      
    runScript('./scripts/updateMatches.js')
      .catch(err => console.error('Error updating matches:', err));
      
    runScript('./scripts/updateCricketNews.js')
      .catch(err => console.error('Error updating cricket news:', err));
    
    // Respond immediately without waiting for updates to complete
    res.json({ message: 'Data updates triggered successfully. This may take a few minutes to complete.' });
  } catch (error) {
    console.error('Error triggering updates:', error);
    res.status(500).json({ error: 'Failed to trigger updates' });
  }
});

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.warn('Warning: Build directory does not exist. Run npm run build first.');
}

// All GET requests not handled before will return the React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Please run npm run build first.');
  }
});

// Initial data update when server starts
if (process.env.NODE_ENV === 'production') {
  console.log('Running initial data updates on server start...');
  runScript('./scripts/updateCricketStats.js')
    .then(() => runScript('./scripts/update_team_stats.js'))
    .then(() => runScript('./scripts/run_live_score_scraper.js'))
    .then(() => runScript('./scripts/updateInsights.js'))
    .then(() => runScript('./scripts/updateCricketNews.js'))
    .then(() => runScript('./scripts/updateMatches.js'))
    .catch(error => console.error('Error running initial updates:', error));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});