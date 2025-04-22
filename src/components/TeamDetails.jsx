import React from 'react';
import PlayerCard from './PlayerCard';

function TeamDetails({ team }) {
  if (!team || !team.players) {
    return (
      <div className="team-section">
        <h3 className="team-header">{team?.teamName || "Team"}</h3>
        <p>Player information not available</p>
      </div>
    );
  }
  
  return (
    <div className="players-grid">
      {team.players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}

export default TeamDetails;