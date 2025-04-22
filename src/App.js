import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import NewsPage from './pages/NewsPage';
import StadiumVRPage from './pages/StadiumVRPage';
import StatsPage from './pages/StatsPage'; 
import Navbar from './components/Navbar';
import './styles.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/match/:matchId" element={<MatchPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/stadium-vr" element={<StadiumVRPage />} />
            <Route path="/stats" element={<StatsPage />} /> {/* Add the new route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;