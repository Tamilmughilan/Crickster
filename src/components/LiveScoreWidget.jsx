import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './LiveScoreWidget.css';

const LiveScoreWidget = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchLiveScores = async () => {
      try {
        const response = await axios.get('/api/live-scores');
        // Make sure we're handling the data safely
        const matches = response.data?.matches || [];
        setLiveMatches(matches);
        
        // Check if lastUpdated exists before trying to parse it
        if (response.data?.lastUpdated) {
          setLastUpdated(new Date(response.data.lastUpdated * 1000));
        } else {
          setLastUpdated(new Date());
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching live scores:", err);
        setError("Failed to load live scores");
        setLoading(false);
      }
    };

    // Fetch immediately on component mount
    fetchLiveScores();

    // Set up polling interval (every 60 seconds)
    const intervalId = setInterval(fetchLiveScores, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format time difference
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins} minutes ago`;
  };

  if (loading) {
    return <div className="live-score-loading">Loading live scores...</div>;
  }

  if (error) {
    return <div className="live-score-error">{error}</div>;
  }

  // Safe check for liveMatches before accessing length
  if (!liveMatches || liveMatches.length === 0) {
    return <div className="live-score-empty">No live matches currently in progress</div>;
  }

  return (
    <div className="live-score-widget">
      <div className="live-score-header">
        <h3>
          <span className="live-indicator"></span>
          Live Matches
        </h3>
        <span className="update-time">Updated: {getTimeSinceUpdate()}</span>
      </div>
      
      <div className="live-matches">
        {liveMatches.map((match, index) => (
          <div key={index} className="live-match-card">
            <div className="match-title">{match.title}</div>
            
            <div className="match-scores">
              {/* Ensure scores exists before mapping */}
              {match.scores && match.scores.map((score, idx) => (
                <div key={idx} className="team-score">{score}</div>
              ))}
            </div>
            
            <div className="match-status">{match.status}</div>
            
            {match.url && (
              <a 
                href={match.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link"
              >
                View on {match.source === 'cricbuzz' ? 'Cricbuzz' : 'ESPN Cricinfo'}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveScoreWidget;