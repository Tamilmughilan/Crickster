// scripts/processCricketData.js
const fs = require('fs');
const path = require('path');

// Define paths
const DATA_DIR = path.join(__dirname, '../public/statsData');
const STATS_DIR = path.join(__dirname, '../public/stats');

// Major franchise leagues to include
const MAJOR_FRANCHISE_LEAGUES = [
  'Indian Premier League',
  'IPL', 
  'SA20',
  'Pakistan Super League',
  'PSL',
  'Big Bash League',
  'BBL',
  'Caribbean Premier League',
  'CPL',
  'The Hundred',
  'Bangladesh Premier League',
  'BPL'
];

// Ensure directories exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

// Check if a match should be included in stats
function shouldIncludeMatch(match) {
  // No valid match info
  if (!match.info) return false;
  
  // Include all international matches
  if (match.info.team_type === 'international') return true;
  
  // Include major franchise T20 leagues
  if (match.info.event && match.info.event.name) {
    if (MAJOR_FRANCHISE_LEAGUES.some(league => 
      match.info.event.name.includes(league))) {
      return true;
    }
  }
  
  // Exclude all other matches
  return false;
}

// Check if a date is within the last 2 months
function isWithinLastTwoMonths(dateString) {
  if (!dateString) return false;
  
  try {
    // Get current date and date from 2 months ago
    const currentDate = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    // Parse the match date
    const matchDate = new Date(dateString);
    
    // Return true if match date is more recent than 2 months ago
    return matchDate >= twoMonthsAgo;
  } catch (err) {
    console.error(`Error parsing date ${dateString}:`, err);
    return false;
  }
}

// Read all JSON files in the stats data directory
function readMatchFiles() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(DATA_DIR, file));
  
  console.log(`Found ${files.length} match files to process`);
  
  const allMatches = files.map(file => {
    try {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading file ${file}:`, err);
      return null;
    }
  }).filter(match => match !== null);
  
  // Filter matches based on criteria
  const filteredMatches = allMatches.filter(shouldIncludeMatch);
  
  console.log(`Filtered to ${filteredMatches.length} international and major franchise matches`);
  
  return filteredMatches;
}

// Process match data to calculate statistics
function processMatchData(matches) {
  console.log(`Processing ${matches.length} matches...`);
  
  // Initialize structure to hold statistics
  const statsData = {
    players: {},
    teams: {},
    recentMatches: []
  };
  
  // Track match dates for filtering recent matches later
  const allMatchesInfo = [];
  
  matches.forEach(match => {
    try {
      // Basic match info
      const eventName = match.info.event ? match.info.event.name : '';
      const matchDate = match.info.dates ? match.info.dates[0] : 'unknown';
      
      const matchInfo = {
        id: match.info.match_type + '_' + matchDate,
        date: matchDate,
        teams: match.info.teams,
        venue: match.info.venue,
        matchType: match.info.match_type,
        eventName: eventName,
        teamType: match.info.team_type || 'unknown',
        result: match.info.outcome
      };
      
      // Store all match info for later filtering
      allMatchesInfo.push(matchInfo);
      
      // Process teams
      match.info.teams.forEach(team => {
        if (!statsData.teams[team]) {
          statsData.teams[team] = {
            name: team,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            runsScored: 0,
            runsConceded: 0,
            wicketsTaken: 0,
            wicketsLost: 0
          };
        }
        
        statsData.teams[team].matches++;
        
        // Update win/loss record
        if (match.info.outcome && match.info.outcome.winner === team) {
          statsData.teams[team].wins++;
        } else if (match.info.outcome && match.info.outcome.winner && match.info.outcome.winner !== team) {
          statsData.teams[team].losses++;
        } else {
          statsData.teams[team].draws++;
        }
      });
      
      // Process player statistics from innings data
      if (match.innings) {
        match.innings.forEach(inning => {
          const battingTeam = inning.team;
          const bowlingTeam = match.info.teams.find(team => team !== battingTeam);
          
          let totalRuns = 0;
          let wickets = 0;
          
          // Skip if no overs data
          if (!inning.overs) return;
          
          // Process each delivery
          inning.overs.forEach(over => {
            over.deliveries.forEach(delivery => {
              // Batting statistics
              const batter = delivery.batter;
              const bowler = delivery.bowler;
              const runs = delivery.runs.batter || 0;
              
              // Initialize player data if not exists
              if (!statsData.players[batter]) {
                statsData.players[batter] = {
                  name: batter,
                  team: battingTeam,
                  batting: {
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    highestScore: 0,
                    innings: 0,
                    outs: 0
                  },
                  bowling: {
                    overs: 0,
                    runs: 0,
                    wickets: 0,
                    economy: 0
                  }
                };
              }
              
              if (!statsData.players[bowler]) {
                statsData.players[bowler] = {
                  name: bowler,
                  team: bowlingTeam,
                  batting: {
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    highestScore: 0,
                    innings: 0,
                    outs: 0
                  },
                  bowling: {
                    overs: 0,
                    runs: 0,
                    wickets: 0,
                    economy: 0
                  }
                };
              }
              
              // Update batting stats
              statsData.players[batter].batting.runs += runs;
              statsData.players[batter].batting.balls += 1;
              
              // Count boundaries
              if (runs === 4) statsData.players[batter].batting.fours += 1;
              if (runs === 6) statsData.players[batter].batting.sixes += 1;
              
              // Update bowling stats
              statsData.players[bowler].bowling.runs += runs;
              statsData.players[bowler].bowling.overs += 1/6; // Approximation
              
              // Process wickets
              if (delivery.wickets) {
                delivery.wickets.forEach(wicket => {
                  wickets++;
                  
                  // Update bowler stats
                  statsData.players[bowler].bowling.wickets += 1;
                  
                  // Update batter stats if they're out
                  const playerOut = wicket.player_out;
                  if (statsData.players[playerOut]) {
                    statsData.players[playerOut].batting.outs += 1;
                  }
                });
              }
              
              totalRuns += runs;
              
              // Add extras if present
              if (delivery.runs.extras) {
                totalRuns += delivery.runs.extras;
              }
            });
          });
          
          // Update team stats
          statsData.teams[battingTeam].runsScored += totalRuns;
          statsData.teams[battingTeam].wicketsLost += wickets;
          statsData.teams[bowlingTeam].runsConceded += totalRuns;
          statsData.teams[bowlingTeam].wicketsTaken += wickets;
        });
      }
      
    } catch (err) {
      console.error('Error processing match:', err);
    }
  });
  
  // Filter for recent matches (last 2 months only)
  statsData.recentMatches = allMatchesInfo
    .filter(match => isWithinLastTwoMonths(match.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
  
  console.log(`Filtered to ${statsData.recentMatches.length} matches from the last 2 months`);
  
  // Calculate derived statistics
  Object.values(statsData.players).forEach(player => {
    // Calculate batting strike rate and average
    if (player.batting.balls > 0) {
      player.batting.strikeRate = ((player.batting.runs / player.batting.balls) * 100).toFixed(2);
    }
    
    if (player.batting.outs > 0) {
      player.batting.average = (player.batting.runs / player.batting.outs).toFixed(2);
    }
    
    // Calculate bowling economy
    if (player.bowling.overs > 0) {
      player.bowling.economy = (player.bowling.runs / player.bowling.overs).toFixed(2);
    }
  });
  
  Object.values(statsData.teams).forEach(team => {
    // Calculate team run rate and win percentage
    if (team.matches > 0) {
      team.winPercentage = ((team.wins / team.matches) * 100).toFixed(2);
    }
  });
  
  return statsData;
}

// Save the processed data to JSON files
function saveProcessedData(statsData) {
  ensureDirectoryExists(STATS_DIR);
  
  // Save player statistics
  fs.writeFileSync(
    path.join(STATS_DIR, 'players.json'),
    JSON.stringify(statsData.players, null, 2)
  );
  
  // Save team statistics
  fs.writeFileSync(
    path.join(STATS_DIR, 'teams.json'),
    JSON.stringify(statsData.teams, null, 2)
  );
  
  // Save recent matches (already filtered and sorted)
  fs.writeFileSync(
    path.join(STATS_DIR, 'recentMatches.json'),
    JSON.stringify(statsData.recentMatches, null, 2)
  );
  
  // Save all stats in one file
  fs.writeFileSync(
    path.join(STATS_DIR, 'allStats.json'),
    JSON.stringify(statsData, null, 2)
  );
  
  console.log('All statistics saved successfully!');
  
  // Output some basic stats
  console.log(`Processed ${statsData.recentMatches.length} recent matches (last 2 months)`);
  console.log(`Stats generated for ${Object.keys(statsData.players).length} players`);
  console.log(`Stats generated for ${Object.keys(statsData.teams).length} teams`);
}

// Main function
function main() {
  try {
    const matches = readMatchFiles();
    const statsData = processMatchData(matches);
    saveProcessedData(statsData);
    console.log('Cricket data processing completed successfully!');
  } catch (err) {
    console.error('Failed to process cricket data:', err);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = main;