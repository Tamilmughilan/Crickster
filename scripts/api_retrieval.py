import requests
import json
import os


RAPIDAPI_KEY = "0f7f60711fmsha1bf1d3b764bcc1p1e8290jsn4980aa31ec3a"
BASE_URL = "https://cricbuzz-cricket.p.rapidapi.com/"

HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com"
}

# Path to save the matches.json file
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "matches.json")

def get_upcoming_matches():
    """Fetches upcoming matches."""
    url = f"{BASE_URL}matches/v1/upcoming"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json().get('typeMatches', [])
    else:
        print(f"❌ Error fetching upcoming matches: {response.status_code}\nResponse: {response.text}")
        return []

def get_match_details(match_id):
    """Fetches details of a specific match."""
    if not match_id:
        print("⚠️ No match_id provided, skipping request")
        return {}

    url = f"{BASE_URL}mcenter/v1/{match_id}"  # Corrected endpoint
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        match_data = response.json()
        
        # Extract and filter player details
        for team in match_data.get("teamDetails", []):
            if "players" in team:
                team["players"] = [
                    {
                        "id": player.get("id"),
                        "name": player.get("name"),
                        "fullName": player.get("fullName"),
                        "role": player.get("role"),
                        "battingStyle": player.get("battingStyle"),
                        "bowlingStyle": player.get("bowlingStyle")
                    }
                    for player in team["players"]
                ]
        return match_data
    else:
        print(f"❌ Failed to fetch details for match_id {match_id}: {response.status_code}\nResponse: {response.text}")
        return {}

def main():
    upcoming_matches = get_upcoming_matches()
    match_list = []
    match_count = 0  # Counter to track number of matches processed

    for match_type in upcoming_matches:
        for series in match_type.get('seriesMatches', []):
            series_name = series.get('seriesAdWrapper', {}).get('seriesName', 'Unknown Tournament')

            for match in series.get('seriesAdWrapper', {}).get('matches', []):
                if match_count >= 20:
                    break  # Stop after processing 10 matches
                
                match_info = match.get('matchInfo', {})
                match_id = match_info.get('matchId')
                team1 = match_info.get('team1', {}).get('teamName', 'Unknown')
                team2 = match_info.get('team2', {}).get('teamName', 'Unknown')
                
                print(f"🔍 Fetching details for {team1} vs {team2}, Match ID: {match_id}")

                match_details = get_match_details(match_id)
                
                match_data = {
                    "tournament": series_name,
                    "match": f"{team1} vs {team2}",
                    "details": match_details
                }
                match_list.append(match_data)
                match_count += 1
            
            if match_count >= 10:
                break  # Stop after processing 10 matches

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    # Save directly to public folder
    with open(OUTPUT_PATH, "w") as f:
        json.dump(match_list, f, indent=4)

    print(f"✅ Match data saved in {OUTPUT_PATH}")

if __name__ == "__main__":
    main()