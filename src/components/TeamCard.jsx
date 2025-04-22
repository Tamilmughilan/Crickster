import React from 'react';
import '../css/TeamCard.css';

const TeamCard = ({ teamName, teamData, onClick }) => {
  // Get team flag emoji - this is a simplified version for illustration
  const getTeamFlag = (teamName) => {
    const flags = {
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'New Zealand': '🇳🇿',
      'South Africa': '🇿🇦',
      'West Indies': '🏝️',
      'Pakistan': '🇵🇰',
      'Sri Lanka': '🇱🇰',
      'Bangladesh': '🇧🇩',
      'Afghanistan': '🇦🇫',
      'Zimbabwe': '🇿🇼',
      'Ireland': '🇮🇪',
      'Chennai Super Kings': '🦁',
      'Mumbai Indians': '🔵',
      'Royal Challengers Bangalore': '🔴',
      'Kolkata Knight Riders': '💜',
      'Delhi Capitals': '🔵',
      'Punjab Kings': '👑',
      'Rajasthan Royals': '💗',
      'Sunrisers Hyderabad': '🧡',
      'Gujarat Titans': '🔷',
      'Lucknow Super Giants': '🟢'
    };
    
    return flags[teamName] || '🏏';
  };

  return (
    <div className="team-card" onClick={onClick}>
      <div className="team-flag">{getTeamFlag(teamName)}</div>
      <h3 className="team-name">{teamName}</h3>
      <div className="team-stats">
        <p>Matches: {teamData.matches_played}</p>
        <p>Win Rate: {teamData.win_percentage}%</p>
        <div className="team-strengths">
          {teamData.strengths.length > 0 ? (
            <div>
              <p className="strengths-title">Strengths:</p>
              <ul>
                {teamData.strengths.slice(0, 2).map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
                {teamData.strengths.length > 2 && <li>+ more...</li>}
              </ul>
            </div>
          ) : (
            <p>No notable strengths</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCard;