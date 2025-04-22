import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PredictionBar from './PredictionBar';
import axios from 'axios';

function MatchCard({ match }) {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Extract match details
  const { tournament } = match;
  const { matchInfo } = match.details;
  
  // Format date and time if available
  let formattedDate = "Date not available";
  if (matchInfo && matchInfo.matchStartTimestamp) {
    const date = new Date(matchInfo.matchStartTimestamp);
    formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Fetch prediction data
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await axios.get('/model/predictions.json');
        const predictions = response.data;
        
        // Find prediction for this match
        const matchPrediction = predictions.find(p => p.match_id === matchInfo.matchId);
        setPrediction(matchPrediction);
      } catch (err) {
        console.error("Error fetching prediction:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrediction();
  }, [matchInfo.matchId]);
  
  // Handle match click
  const handleClick = () => {
    navigate(`/match/${matchInfo.matchId}`);
  };
  
  // Extract match format
  const matchFormat = matchInfo?.matchFormat || "Unknown format";
  const matchDesc = matchInfo?.matchDescription || "";
  
  // Extract venue (assuming it might be added later in the JSON)
  const venueText = matchInfo?.venue?.ground || "Venue not available";
  
  return (
    <div className="match-card" onClick={handleClick}>
      <div className="match-header">
        {tournament}
      </div>
      <div className="match-content">
        <div className="match-teams">
          <span>{matchInfo?.team1?.name || "Team 1"}</span>
          <span className="vs">vs</span>
          <span>{matchInfo?.team2?.name || "Team 2"}</span>
        </div>
        <div className="match-details">
          <div>{matchFormat} {matchDesc}</div>
          <div>{formattedDate}</div>
          <div>{venueText}</div>
        </div>
        
        {/* Prediction Bar */}
        {!loading && (
          <div className="match-prediction">
            {prediction ? (
              <PredictionBar
                team1={matchInfo?.team1?.name || "Team 1"}
                team1Probability={prediction.probabilities[matchInfo?.team1?.name]}
                team2={matchInfo?.team2?.name || "Team 2"}
                team2Probability={prediction.probabilities[matchInfo?.team2?.name]}
              />
            ) : (
              <div className="prediction-unavailable">
                <p>Prediction not available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchCard;