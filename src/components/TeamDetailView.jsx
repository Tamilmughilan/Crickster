import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, 
         PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import '../css/TeamDetailView.css';

const TeamDetailView = ({ teamName, teamData, format, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!teamData) {
    return <div className="loading">Loading team data...</div>;
  }
  
  // Get top batsmen based on runs
  const getTopBatsmen = () => {
    if (!teamData.players) return [];
    
    return Object.entries(teamData.players)
      .filter(([_, stats]) => stats.batting && stats.batting.runs > 0)
      .map(([name, stats]) => ({
        name,
        average: stats.batting.dismissals > 0 ? stats.batting.average : stats.batting.runs,
        strikeRate: stats.batting.strike_rate || 0,
        runs: stats.batting.runs || 0,
        role: stats.role || 'Unknown'
      }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);
  };
  
  // Get top bowlers based on balls bowled instead of wickets
  const getTopBowlers = () => {
    if (!teamData.players) return [];
    
    return Object.entries(teamData.players)
      .filter(([_, stats]) => stats.bowling && stats.bowling.balls_bowled > 0)
      .map(([name, stats]) => ({
        name,
        economy: stats.bowling.economy || 0,
        wickets: stats.bowling.wickets || 0,
        average: stats.bowling.average || 0,
        overs: stats.bowling.overs || 0,
        balls_bowled: stats.bowling.balls_bowled || 0,
        runs_conceded: stats.bowling.runs_conceded || 0,
        role: stats.role || 'Unknown'
      }))
      .sort((a, b) => b.balls_bowled - a.balls_bowled)
      .slice(0, 5);
  };
  
  // Get all-rounders - players who both bat and bowl
  const getAllRounders = () => {
    if (!teamData.players) return [];
    
    return Object.entries(teamData.players)
      .filter(([_, stats]) => 
        stats.batting && stats.batting.balls_faced > 0 && 
        stats.bowling && stats.bowling.balls_bowled > 0)
      .map(([name, stats]) => ({
        name,
        battingAvg: stats.batting.dismissals > 0 ? stats.batting.average : stats.batting.runs,
        bowlingAvg: stats.bowling.average || 0,
        wickets: stats.bowling.wickets || 0,
        runs: stats.batting.runs || 0,
        balls_bowled: stats.bowling.balls_bowled || 0,
        runs_conceded: stats.bowling.runs_conceded || 0
      }))
      .sort((a, b) => (b.runs + b.balls_bowled) - (a.runs + a.balls_bowled))
      .slice(0, 3);
  };
  
  // Team performance radar data
  const getTeamPerformanceData = () => {
    // Calculate team metrics
    const winRate = teamData.win_percentage || 0;
    
    // Calculate batting metrics
    let totalRuns = 0;
    let totalBattingStrikeRate = 0;
    let batsmanCount = 0;
    
    // Calculate bowling metrics
    let totalBallsBowled = 0;
    let totalRunsConceded = 0;
    let bowlerCount = 0;
    
    if (teamData.players) {
      Object.values(teamData.players).forEach(player => {
        if (player.batting && player.batting.runs > 0) {
          totalRuns += player.batting.runs;
          totalBattingStrikeRate += player.batting.strike_rate || 0;
          batsmanCount++;
        }
        
        if (player.bowling && player.bowling.balls_bowled > 0) {
          totalBallsBowled += player.bowling.balls_bowled;
          totalRunsConceded += player.bowling.runs_conceded || 0;
          bowlerCount++;
        }
      });
    }
    
    const avgBattingStrikeRate = batsmanCount > 0 ? totalBattingStrikeRate / batsmanCount : 0;
    const avgEconomy = totalBallsBowled > 0 ? (totalRunsConceded / totalBallsBowled) * 6 : 0;
    
    // Convert to 0-10 scale for radar chart
    const normalizeWinRate = Math.min(10, winRate / 10);
    const normalizeRuns = Math.min(10, totalRuns / 500);
    const normalizeStrikeRate = Math.min(10, avgBattingStrikeRate / 20);
    const normalizeBallsBowled = Math.min(10, totalBallsBowled / 200);
    const normalizeEconomy = avgEconomy > 0 ? Math.max(0, Math.min(10, 10 - avgEconomy / 2)) : 0;
    
    return [
      { category: 'Win Rate', value: normalizeWinRate },
      { category: 'Total Runs', value: normalizeRuns },
      { category: 'Strike Rate', value: normalizeStrikeRate },
      { category: 'Balls Bowled', value: normalizeBallsBowled },
      { category: 'Bowling Economy', value: normalizeEconomy }
    ];
  };
  
  // Player roles distribution
  // Player roles distribution - Updated to exclude "Unknown" from display
const getPlayerRoleDistribution = () => {
  if (!teamData.players) return [];
  
  const roles = { 'Batsman': 0, 'Bowler': 0, 'All-rounder': 0 };
  
  // Assign roles based on stats if not already assigned
  Object.entries(teamData.players).forEach(([name, player]) => {
    if (player.role && player.role !== 'Unknown') {
      roles[player.role] = (roles[player.role] || 0) + 1;
    } else {
      // Dynamic role assignment
      const hasBatting = player.batting && player.batting.balls_faced > 10;
      const hasBowling = player.bowling && player.bowling.balls_bowled > 10;
      
      if (hasBatting && hasBowling) {
        roles['All-rounder'] = (roles['All-rounder'] || 0) + 1;
      } else if (hasBatting) {
        roles['Batsman'] = (roles['Batsman'] || 0) + 1;
      } else if (hasBowling) {
        roles['Bowler'] = (roles['Bowler'] || 0) + 1;
      }
      // No "Unknown" category added for players without sufficient data
    }
  });
  
  return Object.entries(roles).map(([role, count]) => ({
    name: role,
    value: count
  })).filter(item => item.value > 0);
};
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const renderOverviewTab = () => (
    <div className="team-overview">
      <div className="team-summary">
        <h2>{teamName} Summary</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>Matches Played</h4>
            <p className="stat-value">{teamData.matches_played || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Matches Won</h4>
            <p className="stat-value">{teamData.matches_won || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Win Percentage</h4>
            <p className="stat-value">{teamData.win_percentage || 0}%</p>
          </div>
          <div className="stat-box">
            <h4>Total Runs</h4>
            <p className="stat-value">{teamData.total_runs_scored || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Total Runs Conceded</h4>
            <p className="stat-value">{teamData.total_runs_conceded || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="team-strengths-section">
        <h3>Team Strengths</h3>
        <ul className="strengths-list">
          {teamData.strengths && teamData.strengths.length > 0 ? 
            teamData.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            )) : 
            <li>No notable strengths identified</li>
          }
        </ul>
      </div>
      
      <div className="team-performance">
        <h3>Team Performance Radar</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={getTeamPerformanceData()}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar name={teamName} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="role-distribution">
        <h3>Player Roles Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={getPlayerRoleDistribution()}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {getPlayerRoleDistribution().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  const renderBattingTab = () => {
    const topBatsmen = getTopBatsmen();
    
    return (
      <div className="batting-tab">
        <h2>Top Batsmen</h2>
        
        {topBatsmen.length > 0 ? (
          <>
            <div className="batting-charts">
              <div className="chart-wrapper">
                <h3>Batting Runs</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBatsmen}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Runs']} />
                    <Bar dataKey="runs" fill="#8884d8">
                      {topBatsmen.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-wrapper">
                <h3>Strike Rates</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBatsmen}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Strike Rate']} />
                    <Bar dataKey="strikeRate" fill="#82ca9d">
                      {topBatsmen.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <h3>Batsmen Details</h3>
            <div className="players-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Runs</th>
                    <th>Average</th>
                    <th>Strike Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatsmen.map(player => (
                    <tr key={player.name}>
                      <td>{player.name}</td>
                      <td>{player.role}</td>
                      <td>{player.runs}</td>
                      <td>{typeof player.average === 'number' ? player.average.toFixed(2) : 'N/A'}</td>
                      <td>{typeof player.strikeRate === 'number' ? player.strikeRate.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="no-data-message">No batting data available for this team.</div>
        )}
      </div>
    );
  };
  
  const renderBowlingTab = () => {
    const topBowlers = getTopBowlers();
    
    return (
      <div className="bowling-tab">
        <h2>Top Bowlers</h2>
        
        {topBowlers.length > 0 ? (
          <>
            <div className="bowling-charts">
              <div className="chart-wrapper">
                <h3>Balls Bowled</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBowlers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Balls']} />
                    <Bar dataKey="balls_bowled" fill="#8884d8">
                      {topBowlers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-wrapper">
                <h3>Runs Conceded</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBowlers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Runs']} />
                    <Bar dataKey="runs_conceded" fill="#82ca9d">
                      {topBowlers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <h3>Bowlers Details</h3>
            <div className="players-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Overs</th>
                    <th>Runs Conceded</th>
                    <th>Wickets</th>
                    <th>Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map(player => (
                    <tr key={player.name}>
                      <td>{player.name}</td>
                      <td>{player.role}</td>
                      <td>{typeof player.overs === 'number' ? player.overs.toFixed(1) : 'N/A'}</td>
                      <td>{player.runs_conceded}</td>
                      <td>{player.wickets}</td>
                      <td>{typeof player.economy === 'number' ? player.economy.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="no-data-message">No bowling data available for this team.</div>
        )}
      </div>
    );
  };
  
  const renderAllRoundersTab = () => {
    const allRounders = getAllRounders();
    
    // Create comparison data for radar chart
    const getPlayerComparisonData = () => {
      if (allRounders.length === 0) return [];
      
      return allRounders.map(player => {
        // Normalize values to a 0-10 scale
        const battingScore = Math.min(10, player.runs / 100);
        const bowlingScore = Math.min(10, player.balls_bowled / 50);
        const battingAvgScore = Math.min(10, player.battingAvg / 5);
        const bowlingAvgScore = player.bowlingAvg > 0 ? Math.max(0, Math.min(10, 10 - player.bowlingAvg / 5)) : 0;
        
        return [
          { player: player.name, category: 'Runs', value: battingScore },
          { player: player.name, category: 'Balls Bowled', value: bowlingScore },
          { player: player.name, category: 'Batting Score', value: battingAvgScore },
          { player: player.name, category: 'Bowling Score', value: bowlingAvgScore }
        ];
      }).flat();
    };
    
    const playerComparisonData = getPlayerComparisonData();
    
    return (
      <div className="all-rounders-tab">
        <h2>Top All-Rounders</h2>
        
        {allRounders.length > 0 ? (
          <>
            <div className="all-rounders-comparison">
              <h3>Player Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={playerComparisonData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  {allRounders.map((player, index) => (
                    <Radar 
                      key={player.name} 
                      name={player.name} 
                      dataKey="value" 
                      stroke={COLORS[index % COLORS.length]} 
                      fill={COLORS[index % COLORS.length]} 
                      fillOpacity={0.6} 
                      dot
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <h3>All-Rounders Details</h3>
            <div className="players-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Runs</th>
                    <th>Batting Avg</th>
                    <th>Balls Bowled</th>
                    <th>Runs Conceded</th>
                    <th>Wickets</th>
                  </tr>
                </thead>
                <tbody>
                  {allRounders.map(player => (
                    <tr key={player.name}>
                      <td>{player.name}</td>
                      <td>{player.runs}</td>
                      <td>{typeof player.battingAvg === 'number' ? player.battingAvg.toFixed(2) : 'N/A'}</td>
                      <td>{player.balls_bowled}</td>
                      <td>{player.runs_conceded}</td>
                      <td>{player.wickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="no-data-message">No all-rounders data available for this team.</div>
        )}
      </div>
    );
  };
  
  return (
    <div className="team-detail">
      <div className="team-header">
        <button className="back-button" onClick={onBack}>⬅ Back to Teams</button>
        <h1>{teamName} - {format.toUpperCase()} Stats</h1>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'batting' ? 'active' : ''} 
          onClick={() => setActiveTab('batting')}
        >
          Batting
        </button>
        <button 
          className={activeTab === 'bowling' ? 'active' : ''} 
          onClick={() => setActiveTab('bowling')}
        >
          Bowling
        </button>
        <button 
          className={activeTab === 'all-rounders' ? 'active' : ''} 
          onClick={() => setActiveTab('all-rounders')}
        >
          All-Rounders
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'batting' && renderBattingTab()}
        {activeTab === 'bowling' && renderBowlingTab()}
        {activeTab === 'all-rounders' && renderAllRoundersTab()}
      </div>
    </div>
  );
};

export default TeamDetailView;