import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TeamCard from '../components/TeamCard';
import TeamDetailView from '../components/TeamDetailView';
import '../css/TeamsPage.css';

const TeamsPage = () => {
  const [activeFormat, setActiveFormat] = useState('t20');
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        // Fetch the summary data to get a list of teams
        const summaryResponse = await fetch('/teamStats/summary.json');
        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch team summary data');
        }
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
        
        // Fetch detailed data for the current format
        const detailResponse = await fetch(`/teamStats/${activeFormat}_stats.json`);
        if (!detailResponse.ok) {
          throw new Error(`Failed to fetch ${activeFormat} team data`);
        }
        const detailData = await detailResponse.json();
        setTeams(detailData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [activeFormat]);

  const handleFormatChange = (format) => {
    setActiveFormat(format);
    setSelectedTeam(null);
  };

  const handleTeamSelect = (teamName) => {
    setSelectedTeam(teamName);
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
  };

  // Function to generate win percentage chart data
  const getWinPercentageData = () => {
    if (!summary[activeFormat]) return [];
    
    return Object.entries(summary[activeFormat])
      .map(([teamName, data]) => ({
        name: teamName,
        winPercentage: data.win_percentage
      }))
      .sort((a, b) => b.winPercentage - a.winPercentage)
      .slice(0, 5); // Top 5 teams
  };

  // Function to generate matches played chart data
  const getMatchesPlayedData = () => {
    if (!summary[activeFormat]) return [];
    
    return Object.entries(summary[activeFormat])
      .map(([teamName, data]) => ({
        name: teamName,
        matches: data.matches_played
      }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5); // Top 5 teams
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return <div className="loading">Loading team data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (selectedTeam) {
    return (
      <TeamDetailView 
        teamName={selectedTeam} 
        teamData={teams[selectedTeam]} 
        format={activeFormat}
        onBack={handleBackToTeams}
      />
    );
  }

  return (
    <div className="teams-page">
      <h1>Cricket Teams</h1>
      
      <div className="format-selector">
        <button 
          className={activeFormat === 't20' ? 'active' : ''} 
          onClick={() => handleFormatChange('t20')}
        >
          T20 International
        </button>
        <button 
          className={activeFormat === 'odi' ? 'active' : ''} 
          onClick={() => handleFormatChange('odi')}
        >
          ODI
        </button>
        <button 
          className={activeFormat === 'test' ? 'active' : ''} 
          onClick={() => handleFormatChange('test')}
        >
          Test
        </button>
        <button 
          className={activeFormat === 'ipl' ? 'active' : ''} 
          onClick={() => handleFormatChange('ipl')}
        >
          IPL
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Top Teams by Win Percentage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getWinPercentageData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Win Percentage']} />
              <Bar dataKey="winPercentage" fill="#8884d8">
                {getWinPercentageData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-wrapper">
          <h3>Matches Played by Teams</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getMatchesPlayedData()}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="matches"
                nameKey="name"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {getMatchesPlayedData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Matches Played']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2>All Teams ({activeFormat.toUpperCase()})</h2>
      <div className="teams-grid">
        {Object.keys(teams).map(teamName => (
          <TeamCard 
            key={teamName}
            teamName={teamName} 
            teamData={teams[teamName]}
            onClick={() => handleTeamSelect(teamName)}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamsPage;