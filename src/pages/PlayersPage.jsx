import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import '../css/PlayersPage.css';

const PLAYER_COLORS = {
  "Virat Kohli": "#1E88E5",
  "Pat Cummins": "#43A047",
  "Babar Azam": "#00796B",
  "Kane Williamson": "#000000",
  "Joe Root": "#0D47A1",
  "Ben Stokes": "#D32F2F",
  "Steve Smith": "#FFB300",
  "Tendulkar": "#FFA000",
  "R Ponting": "#5D4037",
  "KL Rahul": "#E64A19",
  "Rohit Sharma": "#673AB7",
};

const DEFAULT_COLOR = "#888888";
const FORMAT_COLORS = {
  "TEST": "#d32f2f",
  "ODI": "#1976d2",
  "T20I": "#388e3c"
};

// Manually add known players - this is a fallback in case dynamic loading fails
const KNOWN_PLAYERS = [
  { id: "8733", name: "Virat Kohli", team: "India" },
  { id: "6635", name: "Usman Khawaja", team: "Australia" },
  { id: "1413", name: "Joe Root", team: "England" },
  { id: "576", name: "Rohit Sharma", team: "India" },
  { id: "1446", name: "Shikhar Dhawan", team: "India" },
  { id: "11808", name: "Shubman Gill", team: "India" },
  { id: "9428", name: "Shreyas Iyer", team: "India" },
  { id: "1125", name: "KL Rahul", team: "India" },
  { id: "10863", name: "Fakhar Zaman", team: "Pakistan" },
  { id: "8019", name: "Joe Root", team: "England" },
];

function PlayersPage() {
  const [playersRankings, setPlayersRankings] = useState({
    test: [],
    odi: [],
    t20: []
  });
  const [mostRuns, setMostRuns] = useState([]);
  const [mostWickets, setMostWickets] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlayersData = async () => {
      try {
        // Load rankings data
        let testData = [];
        let odiData = [];
        let t20Data = [];
        
        try {
          const testResponse = await import('../data/test_batsmen_rankings.json');
          testData = testResponse.default?.rank || testResponse.rank || [];
        } catch (e) {
          console.log("Failed to load test rankings:", e);
        }
        
        try {
          const odiResponse = await import('../data/odi_batsmen_rankings.json');
          odiData = odiResponse.default?.rank || odiResponse.rank || [];
        } catch (e) {
          console.log("Failed to load ODI rankings:", e);
        }
        
        try {
          const t20Response = await import('../data/t20_batsmen_rankings.json');
          t20Data = t20Response.default?.rank || t20Response.rank || [];
        } catch (e) {
          console.log("Failed to load T20 rankings:", e);
        }
        
        setPlayersRankings({
          test: processRankingsData(testData),
          odi: processRankingsData(odiData),
          t20: processRankingsData(t20Data)
        });
        
        // Load performance data
        let runsData = [];
        let wicketsData = [];
        
        try {
          const runsResponse = await import('../data/most_runs.json');
          runsData = runsResponse.default?.values || runsResponse.values || [];
        } catch (e) {
          console.log("Failed to load runs data:", e);
        }
        
        try {
          const wicketsResponse = await import('../data/most_wickets.json');
          wicketsData = wicketsResponse.default?.values || wicketsResponse.values || [];
        } catch (e) {
          console.log("Failed to load wickets data:", e);
        }
        
        const processedRunsData = runsData.map(item => ({
          id: item.values[0],
          name: item.values[1],
          matches: parseInt(item.values[2]) || 0,
          innings: parseInt(item.values[3]) || 0,
          runs: parseInt(item.values[4]) || 0,
          average: parseFloat(item.values[5]) || 0
        }));
        setMostRuns(processedRunsData);
        
        const processedWicketsData = wicketsData.map(item => ({
          id: item.values[0],
          name: item.values[1],
          matches: parseInt(item.values[2]) || 0,
          innings: parseInt(item.values[3]) || 0,
          wickets: parseInt(item.values[4]) || 0,
          average: parseFloat(item.values[5]) || 0
        }));
        setMostWickets(processedWicketsData);

        // Collect players from various sources
        const playersList = [...KNOWN_PLAYERS]; // Start with known players as fallback
        
        // Helper to add player to the list while avoiding duplicates
        const addPlayer = (player) => {
          if (!player.id || !player.name) return;
          
          const existingPlayer = playersList.find(p => p.id === player.id);
          if (!existingPlayer) {
            playersList.push(player);
          }
        };
        
        // Add players from team files
        try {
          const team2Data = await import('../data/team_2_players.json');
          const team2Players = team2Data.default?.player || team2Data.player || [];
          
          team2Players.forEach(player => {
            if (player.id && player.name) {
              addPlayer({
                id: player.id,
                name: player.name,
                team: "India",
                battingStyle: player.battingStyle,
                bowlingStyle: player.bowlingStyle
              });
            }
          });
        } catch (e) {
          console.log("Failed to load team_2_players:", e);
        }
        
        try {
          const team3Data = await import('../data/team_3_players.json');
          const team3Players = team3Data.default?.player || team3Data.player || [];
          
          team3Players.forEach(player => {
            if (player.id && player.name) {
              addPlayer({
                id: player.id,
                name: player.name,
                team: "Pakistan",
                battingStyle: player.battingStyle,
                bowlingStyle: player.bowlingStyle
              });
            }
          });
        } catch (e) {
          console.log("Failed to load team_3_players:", e);
        }
        
        // Add players from rankings
        [...testData, ...odiData, ...t20Data].forEach(player => {
          if (player.id && player.name) {
            addPlayer({
              id: player.id,
              name: player.name,
              team: player.country,
              source: "Rankings"
            });
          }
        });
        
        // Sort players by name
        playersList.sort((a, b) => a.name.localeCompare(b.name));
        setAvailablePlayers(playersList);
        
        // Try to load a player by default, starting with Virat Kohli
        let defaultPlayerLoaded = false;
        
        for (const defaultId of ["8733", "6635", "1413"]) {
          if (defaultPlayerLoaded) break;
          
          try {
            const playerData = await import(`../data/player_${defaultId}_info.json`);
            setSelectedPlayer(defaultId);
            setPlayerInfo(playerData.default || playerData);
            defaultPlayerLoaded = true;
          } catch (e) {
            console.log(`Failed to load player ${defaultId}:`, e);
          }
        }
        
        // If no default player could be loaded, try the first player in the list
        if (!defaultPlayerLoaded && playersList.length > 0) {
          try {
            const firstPlayer = playersList[0];
            const playerData = await import(`../data/player_${firstPlayer.id}_info.json`);
            setSelectedPlayer(firstPlayer.id);
            setPlayerInfo(playerData.default || playerData);
          } catch (e) {
            console.log(`Failed to load first player:`, e);
            setError("Failed to load player data. Please try selecting a player from the dropdown.");
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading players data:", error);
        setError("Failed to load players data. Please check console for details.");
        setLoading(false);
      }
    };
    
    loadPlayersData();
  }, []);

  // Helper function to process rankings data
  const processRankingsData = (rankingsData) => {
    return rankingsData.map(player => ({
      id: player.id,
      rank: parseInt(player.rank) || 0,
      name: player.name,
      country: player.country,
      points: parseInt(player.points || player.rating) || 0,
      faceImageId: player.faceImageId
    }));
  };

  const handlePlayerSelect = async (playerId) => {
    if (!playerId) return;
    
    setSelectedPlayer(playerId);
    setLoading(true);
    
    try {
      const info = await import(`../data/player_${playerId}_info.json`);
      setPlayerInfo(info.default || info);
      setError(null);
    } catch (error) {
      console.error(`Error loading data for player ${playerId}:`, error);
      setPlayerInfo(null);
      setError(`Failed to load data for this player. The player_${playerId}_info.json file may not exist.`);
    } finally {
      setLoading(false);
    }
  };

  // Top batsmen across formats
  const prepareTopBatsmenData = () => {
    const topPlayersMap = new Map();
    
    // Process Test rankings
    playersRankings.test.slice(0, 10).forEach(player => {
      topPlayersMap.set(player.name, {
        name: player.name,
        TEST: player.points || 0,
        ODI: 0,
        T20I: 0
      });
    });
    
    // Process ODI rankings
    playersRankings.odi.slice(0, 10).forEach(player => {
      if (topPlayersMap.has(player.name)) {
        topPlayersMap.get(player.name).ODI = player.points || 0;
      } else {
        topPlayersMap.set(player.name, {
          name: player.name,
          TEST: 0,
          ODI: player.points || 0,
          T20I: 0
        });
      }
    });
    
    // Process T20 rankings
    playersRankings.t20.slice(0, 10).forEach(player => {
      if (topPlayersMap.has(player.name)) {
        topPlayersMap.get(player.name).T20I = player.points || 0;
      } else {
        topPlayersMap.set(player.name, {
          name: player.name,
          TEST: 0,
          ODI: 0,
          T20I: player.points || 0
        });
      }
    });
    
    // Convert map to array and get top 8 players by total points
    return Array.from(topPlayersMap.values())
      .map(player => ({
        ...player,
        totalPoints: player.TEST + player.ODI + player.T20I
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 8);
  };

  // Format player batting stats for visualization from player info
  const preparePlayerBattingStats = () => {
    if (!playerInfo || !playerInfo.values) return [];
    
    const formats = ["Test", "ODI", "T20", "IPL"];
    const stats = [];
    
    // Initialize the stats array with format objects
    formats.forEach((format, index) => {
      stats.push({
        format,
        matches: 0,
        innings: 0,
        runs: 0,
        highest: 0,
        average: 0,
        strikeRate: 0,
        fifties: 0,
        hundreds: 0
      });
    });
    
    // Fill in the stats from playerInfo
    playerInfo.values.forEach(row => {
      if (!row.values || row.values.length < 2) return;
      
      const statName = row.values[0];
      const statMapping = {
        "Matches": "matches",
        "Innings": "innings",
        "Runs": "runs",
        "Highest": "highest",
        "Average": "average",
        "SR": "strikeRate",
        "50s": "fifties",
        "100s": "hundreds"
      };
      
      const propName = statMapping[statName];
      if (propName) {
        for (let i = 1; i < Math.min(row.values.length, 5); i++) {
          const value = row.values[i];
          if (value && value !== "-") {
            const parsedValue = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
            stats[i-1][propName] = parsedValue;
          }
        }
      }
    });
    
    return stats.filter(stat => stat.matches > 0);
  };

  // Format player bowling stats for visualization from player info
  const preparePlayerBowlingStats = () => {
    if (!playerInfo || !playerInfo.values) return [];
    
    const formats = ["Test", "ODI", "T20", "IPL"];
    const stats = [];
    
    // Initialize the stats array with format objects
    formats.forEach((format, index) => {
      stats.push({
        format,
        matches: 0,
        innings: 0,
        wickets: 0,
        bestInnings: "",
        average: 0,
        economy: 0
      });
    });
    
    // Try to find bowling stats in player info
    const bowlingRows = playerInfo.values.filter(row => 
      row.values && ["Wickets", "Economy", "Bowling Avg", "Best Innings"].includes(row.values[0])
    );
    
    if (bowlingRows.length > 0) {
      bowlingRows.forEach(row => {
        const statName = row.values[0];
        const statMapping = {
          "Wickets": "wickets",
          "Economy": "economy",
          "Bowling Avg": "average",
          "Best Innings": "bestInnings"
        };
        
        const propName = statMapping[statName];
        if (propName) {
          for (let i = 1; i < Math.min(row.values.length, 5); i++) {
            const value = row.values[i];
            if (value && value !== "-") {
              if (propName === "bestInnings") {
                stats[i-1][propName] = value;
              } else {
                stats[i-1][propName] = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
              }
            }
          }
        }
      });
      
      // Get matches from batting stats
      const matchesRow = playerInfo.values.find(row => row.values && row.values[0] === "Matches");
      if (matchesRow) {
        for (let i = 1; i < Math.min(matchesRow.values.length, 5); i++) {
          const value = matchesRow.values[i];
          if (value && value !== "-") {
            stats[i-1].matches = isNaN(parseInt(value)) ? 0 : parseInt(value);
          }
        }
      }
      
      return stats.filter(stat => (stat.wickets > 0 || stat.economy > 0));
    }
    
    return [];
  };

  const getPlayerName = () => {
    if (playerInfo && playerInfo.appIndex && playerInfo.appIndex.seoTitle) {
      return playerInfo.appIndex.seoTitle.split('-')[0].trim();
    }
    
    const player = availablePlayers.find(p => p.id === selectedPlayer);
    return player ? player.name : "Player Profile";
  };

  const getPlayerTeam = () => {
    const player = availablePlayers.find(p => p.id === selectedPlayer);
    return player ? player.team : "";
  };

  if (loading) {
    return <div className="loading">Loading players data...</div>;
  }

  const topBatsmen = prepareTopBatsmenData();
  const battingStats = preparePlayerBattingStats();
  const bowlingStats = preparePlayerBowlingStats();

  return (
    <div className="players-page">
      <h1>Cricket Players</h1>
      
      <div className="rankings-section">
        <h2>Top Batsmen Across Formats</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topBatsmen}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis label={{ value: 'Rating Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="TEST" name="Test" stackId="a" fill={FORMAT_COLORS.TEST} />
              <Bar dataKey="ODI" name="ODI" stackId="a" fill={FORMAT_COLORS.ODI} />
              <Bar dataKey="T20I" name="T20I" stackId="a" fill={FORMAT_COLORS.T20I} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="performance-section">
        <div className="chart-container half">
          <h2>Most Runs</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mostRuns.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="runs"
                nameKey="name"
                label={entry => entry.name}
              >
                {mostRuns.slice(0, 5).map((entry, index) => (
                  <Cell key={`runs-cell-${index}`} fill={PLAYER_COLORS[entry.name] || DEFAULT_COLOR} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} runs`, props.payload.name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container half">
          <h2>Most Wickets</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mostWickets.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="wickets"
                nameKey="name"
                label={entry => entry.name}
              >
                {mostWickets.slice(0, 5).map((entry, index) => (
                  <Cell key={`wickets-cell-${index}`} fill={PLAYER_COLORS[entry.name] || DEFAULT_COLOR} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} wickets`, props.payload.name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="player-profile-section">
        <h2>Player Profile</h2>
        <div className="player-selector">
          <label>Select Player: </label>
          <select 
            value={selectedPlayer || ''} 
            onChange={(e) => handlePlayerSelect(e.target.value)}
          >
            <option value="">Select a player</option>
            {availablePlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} {player.team ? `(${player.team})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {selectedPlayer && playerInfo && (
          <div className="player-details">
            <div className="player-header">
              <h3>{getPlayerName()}</h3>
              <div className="player-meta">
                {getPlayerTeam() && <span className="player-team">{getPlayerTeam()}</span>}
                {availablePlayers.find(p => p.id === selectedPlayer)?.battingStyle && (
                  <span className="player-batting-style">
                    Batting: {availablePlayers.find(p => p.id === selectedPlayer)?.battingStyle}
                  </span>
                )}
                {availablePlayers.find(p => p.id === selectedPlayer)?.bowlingStyle && (
                  <span className="player-bowling-style">
                    Bowling: {availablePlayers.find(p => p.id === selectedPlayer)?.bowlingStyle}
                  </span>
                )}
              </div>
            </div>
            
            {battingStats.length > 0 && (
              <div className="stats-section">
                <h4>Batting Statistics</h4>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={battingStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="format" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Runs', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Average', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="runs" name="Runs" fill="#8884d8" />
                      <Line yAxisId="right" type="monotone" dataKey="average" name="Average" stroke="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="batting-highlights">
                  <div className="stat-box">
                    <span className="stat-label">Total Centuries</span>
                    <span className="stat-value">{battingStats.reduce((sum, stat) => sum + (stat.hundreds || 0), 0)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Total Fifties</span>
                    <span className="stat-value">{battingStats.reduce((sum, stat) => sum + (stat.fifties || 0), 0)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Total Runs</span>
                    <span className="stat-value">{battingStats.reduce((sum, stat) => sum + (stat.runs || 0), 0)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Highest Score</span>
                    <span className="stat-value">
                      {Math.max(...battingStats.map(stat => stat.highest || 0))}
                    </span>
                  </div>
                </div>
                
                <div className="batting-details">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Format</th>
                        <th>Matches</th>
                        <th>Innings</th>
                        <th>Runs</th>
                        <th>Highest</th>
                        <th>Average</th>
                        <th>Strike Rate</th>
                        <th>50s</th>
                        <th>100s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingStats.map((stat, index) => (
                        <tr key={`batting-${index}`}>
                          <td>{stat.format}</td>
                          <td>{stat.matches}</td>
                          <td>{stat.innings}</td>
                          <td>{stat.runs}</td>
                          <td>{stat.highest}</td>
                          <td>{stat.average.toFixed(2)}</td>
                          <td>{stat.strikeRate.toFixed(2)}</td>
                          <td>{stat.fifties}</td>
                          <td>{stat.hundreds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {bowlingStats.length > 0 && (
              <div className="stats-section">
                <h4>Bowling Statistics</h4>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={bowlingStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="format" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Wickets', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Economy', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="wickets" name="Wickets" fill="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="economy" name="Economy" stroke="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bowling-highlights">
                  <div className="stat-box">
                    <span className="stat-label">Total Wickets</span>
                    <span className="stat-value">{bowlingStats.reduce((sum, stat) => sum + (stat.wickets || 0), 0)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Best Bowling</span>
                    <span className="stat-value">
                      {bowlingStats.find(stat => stat.bestInnings)?.bestInnings || "N/A"}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Average Economy</span>
                    <span className="stat-value">
                      {(bowlingStats.reduce((sum, stat) => sum + (stat.economy || 0), 0) / 
                        bowlingStats.filter(stat => stat.economy > 0).length).toFixed(2) || "N/A"}
                    </span>
                  </div>
                </div>
                
                <div className="bowling-details">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Format</th>
                        <th>Matches</th>
                        <th>Wickets</th>
                        <th>Best</th>
                        <th>Average</th>
                        <th>Economy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingStats.map((stat, index) => (
                        <tr key={`bowling-${index}`}>
                          <td>{stat.format}</td>
                          <td>{stat.matches}</td>
                          <td>{stat.wickets}</td>
                          <td>{stat.bestInnings || "N/A"}</td>
                          <td>{stat.average ? stat.average.toFixed(2) : "N/A"}</td>
                          <td>{stat.economy ? stat.economy.toFixed(2) : "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {!battingStats.length && !bowlingStats.length && (
              <div className="no-stats-message">
                <p>No detailed statistics available for this player.</p>
                <p>This may happen if the player's data is not properly formatted in the JSON file.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayersPage;