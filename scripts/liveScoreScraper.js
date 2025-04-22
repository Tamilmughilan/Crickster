// scripts/liveScoreScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'live_scores.json');

async function scrapeCricbuzzLiveScores() {
  try {
    const url = "https://www.cricbuzz.com/cricket-match/live-scores";
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    const $ = cheerio.load(response.data);
    const liveMatches = [];
    
    // Find all live match containers
    $(".cb-mtch-lst.cb-tms-itm").each((i, element) => {
      // Check if it's a live match
      const statusElement = $(element).find(".cb-text-live");
      if (statusElement.length === 0) return;
      
      // Extract match details
      const teamsElement = $(element).find(".cb-billing-plans-text");
      if (teamsElement.length === 0) return;
      
      const title = teamsElement.text().trim();
      
      // Extract score
      const scoreElements = $(element).find(".cb-scr-wll-chvrn");
      const scores = scoreElements.map((_, el) => $(el).text().trim()).get().filter(Boolean);
      
      // Extract match status/summary
      const statusText = $(element).find(".cb-text-complete");
      const status = statusText.length ? statusText.text().trim() : "Live";
      
      // Extract match URL for more details
      const linkElement = $(element).find("a");
      const matchUrl = linkElement.length ? `https://www.cricbuzz.com${linkElement.attr('href')}` : null;
      
      // Extract match ID from URL
      let matchId = null;
      if (matchUrl && matchUrl.includes("/live-cricket-scores/")) {
        matchId = matchUrl.split("/live-cricket-scores/")[1].split("/")[0];
      }
      
      const matchData = {
        id: matchId,
        title: title,
        scores: scores,
        status: status,
        url: matchUrl,
        source: "cricbuzz"
      };
      
      liveMatches.push(matchData);
    });
    
    return liveMatches;
  } catch (e) {
    console.error(`Error scraping Cricbuzz: ${e}`);
    return [];
  }
}

async function scrapeEspnCricinfoLiveScores() {
  try {
    const url = "https://www.espncricinfo.com/live-cricket-score";
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    const $ = cheerio.load(response.data);
    const liveMatches = [];
    
    // Find all live match containers
    $(".ds-p-0").each((i, element) => {
      // Check if it's a live match
      const statusElement = $(element).find(".ds-text-tight-xs");
      if (statusElement.length === 0 || !statusElement.text().includes("LIVE")) return;
      
      // Extract teams
      const teams = $(element).find(".ds-flex .ds-text-tight-m");
      const teamNames = teams.map((_, el) => $(el).text().trim()).get().filter(Boolean);
      
      if (teamNames.length < 2) return;
      
      const title = `${teamNames[0]} vs ${teamNames[1]}`;
      
      // Extract scores
      const scoreElements = $(element).find(".ds-text-compact-s");
      const scores = scoreElements.map((_, el) => $(el).text().trim()).get().filter(Boolean);
      
      // Extract status
      const status = statusElement.length ? statusElement.text().trim() : "Live";
      
      // Extract match URL
      const linkElement = $(element).find("a");
      const matchUrl = linkElement.length ? `https://www.espncricinfo.com${linkElement.attr('href')}` : null;
      
      // Extract match ID from URL
      let matchId = null;
      if (matchUrl) {
        const urlParts = matchUrl.split("/");
        if (urlParts.length > 1) {
          matchId = /^\d+$/.test(urlParts[urlParts.length - 2]) ? urlParts[urlParts.length - 2] : urlParts[urlParts.length - 1];
        }
      }
      
      const matchData = {
        id: matchId,
        title: title,
        scores: scores,
        status: status,
        url: matchUrl,
        source: "espn_cricinfo"
      };
      
      liveMatches.push(matchData);
    });
    
    return liveMatches;
  } catch (e) {
    console.error(`Error scraping ESPN Cricinfo: ${e}`);
    return [];
  }
}

async function updateLiveScores() {
  try {
    // Try Cricbuzz first
    let liveMatches = await scrapeCricbuzzLiveScores();
    
    // If Cricbuzz fails or returns no matches, try ESPN Cricinfo
    if (!liveMatches || liveMatches.length === 0) {
      liveMatches = await scrapeEspnCricinfoLiveScores();
    }
    
    // Save to file
    const liveScoresData = {
      matches: liveMatches,
      lastUpdated: Math.floor(Date.now() / 1000)
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(liveScoresData, null, 2));
    console.log(`Updated live scores: ${liveMatches.length} matches found`);
    
    return liveScoresData;
  } catch (e) {
    console.error(`Error updating live scores: ${e}`);
    return { matches: [], lastUpdated: Math.floor(Date.now() / 1000) };
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  updateLiveScores()
    .then(() => console.log('Live scores updated successfully'))
    .catch(err => console.error('Error:', err));
}

module.exports = { updateLiveScores };