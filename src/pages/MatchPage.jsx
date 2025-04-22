import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MatchDetails from '../components/MatchDetails';
import axios from 'axios';

function MatchPage() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        // In development, we would use a backend API
        // For simplicity in this example, we'll read directly from matches.json
        const response = await axios.get('/matches.json');
        const matches = response.data;
        
        // Find the specific match by ID
        const foundMatch = matches.find(m => 
          m.details && m.details.matchInfo && m.details.matchInfo.matchId === parseInt(matchId)
        );
        
        if (foundMatch) {
          setMatch(foundMatch);
        } else {
          setError("Match not found");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching match details:", err);
        setError("Failed to load match details. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchMatchDetails();
  }, [matchId]);
  
  if (loading) {
    return <div className="loading">Loading match details...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div>
      <MatchDetails match={match} />
    </div>
  );
}

export default MatchPage;