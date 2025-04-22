// pages/StatsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import '../css/StatsPage.css';

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    players: {},
    teams: {},
    recentMatches: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch the stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/stats/allStats.json');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics data');
        }
        const data = await response.json();
        setStats(data);
        
        // Get last modified date of the stats file
        const fileInfoResponse = await fetch('/stats/allStats.json', { method: 'HEAD' });
        if (fileInfoResponse.ok) {
          const lastModified = fileInfoResponse.headers.get('Last-Modified');
          setLastUpdated(new Date(lastModified).toLocaleString());
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Convert players object to array and sort by runs
  const getTopBatsmen = () => {
    return Object.values(stats.players)
      .sort((a, b) => b.batting.runs - a.batting.runs)
      .slice(0, 10);
  };

  // Get top bowlers by wickets
  const getTopBowlers = () => {
    return Object.values(stats.players)
      .sort((a, b) => b.bowling.wickets - a.bowling.wickets)
      .slice(0, 10);
  };

  // Get teams with highest win percentage
  const getTeamPerformance = () => {
    return Object.values(stats.teams)
      .sort((a, b) => b.winPercentage - a.winPercentage);
  };

  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Render loading state
  if (loading) {
    return (
      <div className="stats-container loading">
        <h1>Cricket Statistics</h1>
        <div className="loading-spinner">Loading statistics...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="stats-container error">
        <h1>Cricket Statistics</h1>
        <div className="error-message">
          <p>Failed to load statistics: {error}</p>
          <p>Please try again later or check if the data has been generated correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <header className="stats-header">
        <h1>Cricket Statistics Dashboard</h1>
        {lastUpdated && (
          <p className="last-updated">Last updated: {lastUpdated}</p>
        )}
      </header>

      <div className="stats-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'batsmen' ? 'active' : ''} 
          onClick={() => setActiveTab('batsmen')}
        >
          Batsmen
        </button>
        <button 
          className={activeTab === 'bowlers' ? 'active' : ''} 
          onClick={() => setActiveTab('bowlers')}
        >
          Bowlers
        </button>
        <button 
          className={activeTab === 'teams' ? 'active' : ''} 
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button 
          className={activeTab === 'matches' ? 'active' : ''} 
          onClick={() => setActiveTab('matches')}
        >
          Recent Matches
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Cricket Statistics Overview</h2>
            <div className="stats-cards">
              <div className="stats-card">
                <h3>Recent Matches</h3>
                <div className="card-value">{stats.recentMatches.length}</div>
              </div>
              <div className="stats-card">
                <h3>Players</h3>
                <div className="card-value">{Object.keys(stats.players).length}</div>
              </div>
              <div className="stats-card">
                <h3>Teams</h3>
                <div className="card-value">{Object.keys(stats.teams).length}</div>
              </div>
              <div className="stats-card">
                <h3>Total Runs</h3>
                <div className="card-value">
                  {Object.values(stats.players).reduce((sum, player) => sum + player.batting.runs, 0)}
                </div>
              </div>
            </div>

            <div className="overview-charts">
              <div className="chart-container">
                <h3>Team Win Percentage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTeamPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="winPercentage" fill="#8884d8" name="Win Percentage" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Top Run Scorers</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTopBatsmen().slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="batting.runs" fill="#82ca9d" name="Runs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'batsmen' && (
          <div className="batsmen-section">
            <h2>Top Batsmen</h2>
            <div className="stats-charts">
              <div className="chart-container">
                <h3>Runs Scored</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopBatsmen()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
  contentStyle={{ 
    backgroundColor: 'rgba(30, 20, 45, 0.9)', 
    border: '1px solid #7f49cb',
    borderRadius: '8px',
    color: '#d8c9ff'  // Light purple text color to match your theme
  }}
/>
                    <Legend />
                    <Bar dataKey="batting.runs" fill="#8884d8" name="Runs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Strike Rate</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopBatsmen()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="batting.strikeRate" fill="#82ca9d" name="Strike Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stats-charts">
              <div className="chart-container">
                <h3>Boundaries Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopBatsmen().slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
  contentStyle={{ 
    backgroundColor: 'rgba(30, 20, 45, 0.9)', 
    border: '1px solid #7f49cb',
    borderRadius: '8px',
    color: '#d8c9ff'  // Light purple text color to match your theme
  }}
/>
                    <Legend />
                    <Bar dataKey="batting.fours" fill="#0088FE" name="Fours" />
                    <Bar dataKey="batting.sixes" fill="#00C49F" name="Sixes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Batting Details</h3>
                <div className="table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>SR</th>
                        <th>4s</th>
                        <th>6s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopBatsmen().map((player, idx) => (
                        <tr key={idx}>
                          <td>{player.name}</td>
                          <td>{player.team}</td>
                          <td>{player.batting.runs}</td>
                          <td>{player.batting.balls}</td>
                          <td>{player.batting.strikeRate}</td>
                          <td>{player.batting.fours}</td>
                          <td>{player.batting.sixes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bowlers' && (
          <div className="bowlers-section">
            <h2>Top Bowlers</h2>
            <div className="stats-charts">
              <div className="chart-container">
                <h3>Wickets Taken</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopBowlers()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bowling.wickets" fill="#FF8042" name="Wickets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Bowling Economy</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopBowlers()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bowling.economy" fill="#FFBB28" name="Economy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h3>Bowling Details</h3>
              <div className="table-container">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Wickets</th>
                      <th>Overs</th>
                      <th>Runs Conceded</th>
                      <th>Economy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTopBowlers().map((player, idx) => (
                      <tr key={idx}>
                        <td>{player.name}</td>
                        <td>{player.team}</td>
                        <td>{player.bowling.wickets}</td>
                        <td>{Math.floor(player.bowling.overs)}.{Math.round((player.bowling.overs % 1) * 6)}</td>
                        <td>{player.bowling.runs}</td>
                        <td>{player.bowling.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="teams-section">
            <h2>Team Performance</h2>
            <div className="stats-charts">
              <div className="chart-container">
                <h3>Team Win Percentage</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTeamPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="winPercentage" fill="#8884d8" name="Win %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Win/Loss Record</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTeamPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" stackId="a" fill="#82ca9d" name="Wins" />
                    <Bar dataKey="losses" stackId="a" fill="#ff7675" name="Losses" />
                    <Bar dataKey="draws" stackId="a" fill="#74b9ff" name="Draws" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stats-charts">
              <div className="chart-container">
                <h3>Runs Scored vs Conceded</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTeamPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="runsScored" fill="#00C49F" name="Runs Scored" />
                    <Bar dataKey="runsConceded" fill="#FF8042" name="Runs Conceded" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Team Details</h3>
                <div className="table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Matches</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win %</th>
                        <th>Runs Scored</th>
                        <th>Wickets Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTeamPerformance().map((team, idx) => (
                        <tr key={idx}>
                          <td>{team.name}</td>
                          <td>{team.matches}</td>
                          <td>{team.wins}</td>
                          <td>{team.losses}</td>
                          <td>{team.winPercentage}%</td>
                          <td>{team.runsScored}</td>
                          <td>{team.wicketsTaken}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="matches-section">
            <h2>Recent Matches</h2>
            <div className="recent-matches">
              {stats.recentMatches.length > 0 ? (
                stats.recentMatches.map((match, idx) => (
                  <div className="match-card" key={idx}>
                    <div className="match-header">
                      <span className="match-type">{match.matchType}</span>
                      <span className="match-date">{match.date}</span>
                    </div>
                    <div className="match-teams">
                      <div className="team team1">{match.teams[0]}</div>
                      <div className="vs">vs</div>
                      <div className="team team2">{match.teams[1]}</div>
                    </div>
                    <div className="match-venue">
                      <span className="venue-label">Venue:</span> {match.venue}
                    </div>
                    <div className="match-result">
                      {match.result && match.result.winner ? (
                        <div className="winner">
                          Winner: <span>{match.result.winner}</span>
                          {match.result.by && (
                            <span className="win-margin">
                              {' by '}
                              {match.result.by.wickets && `${match.result.by.wickets} wickets`}
                              {match.result.by.runs && `${match.result.by.runs} runs`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="draw">Match Drawn or No Result</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-matches">
                  No recent matches available.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;