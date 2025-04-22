import React, { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import LiveScoreWidget from '../components/LiveScoreWidget';
import axios from 'axios';

function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('matches.json');
        setMatches(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again later.");
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div>
      {/* Live Score Widget - always displayed regardless of match loading state */}
      <LiveScoreWidget />
      
      <h2>Upcoming Cricket Matches</h2>
      
      {loading ? (
        <div className="loading">Loading matches...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : matches.length === 0 ? (
        <p>No upcoming matches found.</p>
      ) : (
        <div className="matches-grid">
          {matches.map((match, index) => (
            <MatchCard key={index} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;