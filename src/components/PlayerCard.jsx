import React, { useState } from 'react';

function PlayerCard({ player }) {
  // Always declare Hooks at the top level, regardless of conditions
  const [imageError, setImageError] = useState(false);
  
  // If player is undefined or null, return after Hook declarations
  if (!player) return null;
  
  // Extract player details
  const { name, fullName, role, captain, battingStyle, bowlingStyle, faceImageId } = player;
  
  // Construct player image URL if available
  let playerImageUrl = null;
  if (faceImageId) {
    playerImageUrl = `https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c${faceImageId}/i.jpg`;
  }
  
  // Determine player styles to display
  let styleText = "";
  if (role === "Batsman" && battingStyle) {
    styleText = `Batting: ${battingStyle}`;
  } else if (role === "Bowler" && bowlingStyle) {
    styleText = `Bowling: ${bowlingStyle}`;
  } else if ((role === "All-Rounder" || role === "Bowling Allrounder" || role === "Batting Allrounder") && (battingStyle || bowlingStyle)) {
    styleText = [];
    if (battingStyle) styleText.push(`Batting: ${battingStyle}`);
    if (bowlingStyle) styleText.push(`Bowling: ${bowlingStyle}`);
    styleText = styleText.join(' | ');
  }
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div className="player-card">
      <div className="player-image">
        {playerImageUrl && !imageError ? (
          <img 
            src={playerImageUrl} 
            alt={name} 
            onError={handleImageError}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="player-avatar">
            <span>{(fullName || name)?.charAt(0) || '?'}</span>
          </div>
        )}
      </div>
      <div className="player-info">
        <div className="player-name">
          {fullName || name || "Unknown"}
          {captain && <span className="captain-badge">Captain</span>}
        </div>
        <div className="player-role">{role || "Unknown role"}</div>
        {styleText && <div className="player-style">{styleText}</div>}
      </div>
    </div>
  );
}

export default PlayerCard;