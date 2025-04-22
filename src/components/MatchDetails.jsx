import React, { useState, useEffect } from 'react';
import TeamDetails from './TeamDetails';
import PredictionBar from './PredictionBar';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MatchDetails({ match }) {
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  
  // First, store the matchId in a variable or use optional chaining to avoid errors
  const matchId = match?.details?.matchInfo?.matchId;
  
  // Move useEffect to the top level, before any conditional returns
  useEffect(() => {
    // Only fetch if we have a valid matchId
    if (matchId) {
      const fetchPrediction = async () => {
        try {
          const response = await axios.get('/model/predictions.json');
          const predictions = response.data;
          
          // Find prediction for this match
          const matchPrediction = predictions.find(p => p.match_id === matchId);
          setPrediction(matchPrediction);
        } catch (err) {
          console.error("Error fetching prediction:", err);
        } finally {
          setPredictionLoading(false);
        }
      };
      
      fetchPrediction();
    } else {
      setPredictionLoading(false);
    }
  }, [matchId]); // Use matchId as dependency instead of matchInfo.matchId
  
  // Now we can have the early return
  if (!match || !match.details || !match.details.matchInfo) {
    return <div className="error">Match details not available</div>;
  }
  
  const { tournament } = match;
  const { matchInfo } = match.details;
  const venueInfo = match.details.venueInfo || {};
  
  // Format date
  let formattedDate = "Date not available";
  if (matchInfo && matchInfo.matchStartTimestamp) {
    const date = new Date(matchInfo.matchStartTimestamp);
    formattedDate = date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Extract venue details
  const venueName = venueInfo.ground || venueInfo.name || 'Venue information not available';
  const venueCity = venueInfo.city || '';
  const venueCountry = venueInfo.country || '';
  const venueLocation = [venueCity, venueCountry].filter(Boolean).join(', ');
  
  // Get status from matchInfo
  const status = matchInfo?.state || 'Status not available';
  
  return (
    <div className="match-detail-container">
      <Link to="/" className="back-button">← Back to Matches</Link>
      
      <h2 className="match-title">{match.match || `${matchInfo?.team1?.name || 'Team 1'} vs ${matchInfo?.team2?.name || 'Team 2'}`}</h2>
      
      {/* Match Prediction Section */}
      <div className="match-prediction-section">
        <h3>Match Prediction</h3>
        {predictionLoading ? (
          <div className="loading-prediction">Loading prediction...</div>
        ) : prediction ? (
          <div className="full-prediction">
            <PredictionBar
              team1={matchInfo?.team1?.name || "Team 1"}
              team1Probability={prediction.probabilities[matchInfo?.team1?.name]}
              team2={matchInfo?.team2?.name || "Team 2"}
              team2Probability={prediction.probabilities[matchInfo?.team2?.name]}
            />
            <div className="prediction-details">
              <p className="prediction-note">
                Based on historical data, team performance, and venue statistics
              </p>
              {prediction.venue && (
                <p className="prediction-venue">
                  <strong>Venue:</strong> {prediction.venue}
                </p>
              )}
              {prediction.format && (
                <p className="prediction-format">
                  <strong>Format:</strong> {prediction.format.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="no-prediction">
            <p>No prediction available for this match</p>
          </div>
        )}
      </div>
      
      <div>
        <p><strong>Tournament:</strong> {tournament || 'Unknown tournament'}</p>
        <p><strong>Format:</strong> {matchInfo.matchFormat || 'Unknown format'} {matchInfo.matchDescription || ''}</p>
        <p><strong>Date:</strong> {formattedDate}</p>
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      {/* Enhanced Venue Information */}
      <div className="venue-info">
        <div className="venue-name">{venueName}</div>
        {venueLocation && <div className="venue-location">{venueLocation}</div>}
        
        {venueInfo.capacity && (
          <div className="venue-details">
            <div className="venue-detail-item">
              <span>Capacity:</span> {venueInfo.capacity}
            </div>
            
            {venueInfo.timezone && (
              <div className="venue-detail-item">
                <span>Timezone:</span> {venueInfo.timezone}
              </div>
            )}
            
            {venueInfo.established && (
              <div className="venue-detail-item">
                <span>Established:</span> {venueInfo.established}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="teams-container">
        <div className="team-section">
          <h3 className="team-header">{matchInfo?.team1?.name || 'Team 1'}</h3>
          {matchInfo?.team1?.playerDetails && matchInfo.team1.playerDetails.length > 0 ? (
            <TeamDetails 
              team={{
                teamName: matchInfo.team1.name,
                players: matchInfo.team1.playerDetails
              }} 
            />
          ) : (
            <p>Player information not available</p>
          )}
        </div>
        
        <div className="team-section">
          <h3 className="team-header">{matchInfo?.team2?.name || 'Team 2'}</h3>
          {matchInfo?.team2?.playerDetails && matchInfo.team2.playerDetails.length > 0 ? (
            <TeamDetails 
              team={{
                teamName: matchInfo.team2.name,
                players: matchInfo.team2.playerDetails
              }} 
            />
          ) : (
            <p>Player information not available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchDetails;