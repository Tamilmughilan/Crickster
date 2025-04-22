import React from 'react';

function PredictionBar({ team1, team1Probability, team2, team2Probability }) {
  // Handle case when prediction data is not available
  if (!team1Probability || !team2Probability) {
    return (
      <div className="prediction-unavailable">
        <p>Prediction not available for this match</p>
      </div>
    );
  }

  // Round probabilities to 1 decimal place for display
  const team1Rounded = parseFloat(team1Probability).toFixed(1);
  const team2Rounded = parseFloat(team2Probability).toFixed(1);

  return (
    <div className="prediction-container">
      <div className="prediction-header">
        <span className="prediction-label">Match Prediction</span>
      </div>
      
      <div className="team-names">
        <span className="team1-name">{team1}</span>
        <span className="team2-name">{team2}</span>
      </div>
      
      <div className="prediction-bar-container">
        <div 
          className="prediction-bar team1-bar" 
          style={{ width: `${team1Rounded}%` }}
        >
          <span className="prediction-percentage">{team1Rounded}%</span>
        </div>
        <div 
          className="prediction-bar team2-bar" 
          style={{ width: `${team2Rounded}%` }}
        >
          <span className="prediction-percentage">{team2Rounded}%</span>
        </div>
      </div>
    </div>
  );
}

export default PredictionBar;