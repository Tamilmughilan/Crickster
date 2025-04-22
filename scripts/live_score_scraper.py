import requests
from bs4 import BeautifulSoup
import json
from flask import Flask, jsonify
import time
import threading

app = Flask(__name__)


live_scores_cache = {
    'data': [],
    'last_updated': 0
}

CACHE_REFRESH_INTERVAL = 60  # 1 minute

def scrape_cricbuzz_live_scores():
    """
    Scrapes live cricket match scores from Cricbuzz
    """
    try:
        url = "https://www.cricbuzz.com/cricket-match/live-scores"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        live_matches = []
        
        # Find all live match containers
        match_elements = soup.select(".cb-mtch-lst.cb-tms-itm")
        for match in match_elements:
            # Check if it's a live match
            status_element = match.select_one(".cb-text-live")
            if not status_element:
                continue
                
            # Extract match details
            teams_element = match.select_one(".cb-billing-plans-text")
            if not teams_element:
                continue
                
            title = teams_element.text.strip()
            
            # Extract score
            score_elements = match.select(".cb-scr-wll-chvrn")
            scores = [score.text.strip() for score in score_elements if score.text.strip()]
            
            # Extract match status/summary
            status_text = match.select_one(".cb-text-complete")
            status = status_text.text.strip() if status_text else "Live"
            
            # Extract match URL for more details
            link_element = match.select_one("a")
            match_url = f"https://www.cricbuzz.com{link_element['href']}" if link_element else None
            
            # Extract match ID from URL
            match_id = None
            if match_url and "/live-cricket-scores/" in match_url:
                match_id = match_url.split("/live-cricket-scores/")[1].split("/")[0]
            
            match_data = {
                "id": match_id,
                "title": title,
                "scores": scores,
                "status": status,
                "url": match_url,
                "source": "cricbuzz"
            }
            
            live_matches.append(match_data)
            
        return live_matches
    
    except Exception as e:
        print(f"Error scraping Cricbuzz: {e}")
        return []

def scrape_espn_cricinfo_live_scores():
    """
    Scrapes live cricket match scores from ESPN Cricinfo
    """
    try:
        url = "https://www.espncricinfo.com/live-cricket-score"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        live_matches = []
        
        # Find all live match containers
        match_elements = soup.select(".ds-p-0")
        
        for match in match_elements:
            # Check if it's a live match
            status_element = match.select_one(".ds-text-tight-xs")
            if not status_element or "LIVE" not in status_element.text:
                continue
            
            # Extract teams
            teams = match.select(".ds-flex .ds-text-tight-m")
            team_names = [team.text.strip() for team in teams if team.text.strip()]
            
            if not team_names or len(team_names) < 2:
                continue
                
            title = f"{team_names[0]} vs {team_names[1]}"
            
            # Extract scores
            score_elements = match.select(".ds-text-compact-s")
            scores = [score.text.strip() for score in score_elements if score.text.strip()]
            
            # Extract status
            status = status_element.text.strip() if status_element else "Live"
            
            # Extract match URL
            link_element = match.select_one("a")
            match_url = f"https://www.espncricinfo.com{link_element['href']}" if link_element else None
            
            # Extract match ID from URL
            match_id = None
            if match_url:
                url_parts = match_url.split("/")
                if len(url_parts) > 1:
                    match_id = url_parts[-2] if url_parts[-2].isdigit() else url_parts[-1]
            
            match_data = {
                "id": match_id,
                "title": title,
                "scores": scores,
                "status": status,
                "url": match_url,
                "source": "espn_cricinfo"
            }
            
            live_matches.append(match_data)
            
        return live_matches
    
    except Exception as e:
        print(f"Error scraping ESPN Cricinfo: {e}")
        return []

def update_live_scores_cache():
    """Updates the cache with fresh live scores"""
    while True:
        try:
            # Try Cricbuzz first
            cricbuzz_scores = scrape_cricbuzz_live_scores()
            
            # If Cricbuzz fails or returns no matches, try ESPN Cricinfo
            if not cricbuzz_scores:
                espn_scores = scrape_espn_cricinfo_live_scores()
                live_scores_cache['data'] = espn_scores
            else:
                live_scores_cache['data'] = cricbuzz_scores
                
            live_scores_cache['last_updated'] = time.time()
            print(f"Cache updated with {len(live_scores_cache['data'])} live matches")
        
        except Exception as e:
            print(f"Error updating cache: {e}")
        
        # Wait for the next refresh interval
        time.sleep(CACHE_REFRESH_INTERVAL)

@app.route('/api/live-scores', methods=['GET'])
def get_live_scores():
    """API endpoint to get live cricket scores"""
    return jsonify({
        'matches': live_scores_cache['data'],
        'lastUpdated': live_scores_cache['last_updated']
    })

if __name__ == '__main__':
    # Start the cache updating thread
    cache_thread = threading.Thread(target=update_live_scores_cache, daemon=True)
    cache_thread.start()
    
    # Start the Flask API server
    app.run(debug=True, port=5001)