import os
import json
import pandas as pd
from collections import defaultdict
from datetime import datetime

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define relative paths
DATA_DIR = os.path.abspath(os.path.join(script_dir, '..', 'public', 'vrdata'))
OUTPUT_DIR = os.path.abspath(os.path.join(script_dir, '..', 'public', 'stats'))

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Path for the last updated timestamp file
LAST_UPDATE_FILE = os.path.join(OUTPUT_DIR, 'last_updated.txt')

# Modify the INCLUDED_TEAMS list to include SA20 teams
INTERNATIONAL_TEAMS = [
    'Australia', 'England', 'India', 'Pakistan', 'South Africa', 'New Zealand', 
    'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan'
]

IPL_TEAMS = [
    'Chennai Super Kings', 'Mumbai Indians', 'Royal Challengers Bangalore', 
    'Kolkata Knight Riders', 'Delhi Capitals', 'Sunrisers Hyderabad', 
    'Rajasthan Royals', 'Punjab Kings', 'Lucknow Super Giants', 'Gujarat Titans'
]

# Add SA20 teams
SA20_TEAMS = [
    'MI Cape Town', 'Paarl Royals', 'Pretoria Capitals', 'Joburg Super Kings',
    'Durban Super Giants', 'Sunrisers Eastern Cape'
]

# Combined list of teams we want to include
INCLUDED_TEAMS = INTERNATIONAL_TEAMS + IPL_TEAMS + SA20_TEAMS


def process_match_data(file_path):
    """Process a single match JSON file and extract boundary information"""
    with open(file_path, 'r', encoding='utf-8') as f:
        match_data = json.load(f)
    
    # Basic match information
    match_info = {
        'date': match_data['info']['dates'][0],
        'teams': match_data['info']['teams'],
        'venue': match_data['info']['venue'],
        'match_type': match_data['info']['match_type']
    }
    
    # Check if this is an international, IPL, or SA20 match
    teams = match_data['info']['teams']
    
    # Check if any of the teams are in our included list
    is_relevant_match = any(team in INCLUDED_TEAMS for team in teams)
    
    # For IPL and SA20, we might also check for competition name if available
    if 'event' in match_data['info']:
        event_name = match_data['info']['event'].get('name', '').lower()
        if 'ipl' in event_name or 'indian premier league' in event_name or 'sa20' in event_name:
            is_relevant_match = True
    
    if not is_relevant_match:
        return {}, match_info  # Return empty stats if not a relevant match

    # Initialize player stats
    player_stats = defaultdict(lambda: {'name': '', 'team': '', 'fours': 0, 'sixes': 0, 
                                        'shots': [], 'matches': 0, 'runs': 0})
    
    # Process each innings
    for innings in match_data.get('innings', []):
        team = innings['team']
        
        # Skip if team is not international or IPL
        if team not in INCLUDED_TEAMS:
            continue
        
        # Process each over
        for over in innings.get('overs', []):
            for delivery in over.get('deliveries', []):
                batter = delivery['batter']
                
                # Update player team if not already set
                if not player_stats[batter]['team']:
                    player_stats[batter]['team'] = team
                
                # Count matches for the player
                player_stats[batter]['matches'] = 1
                
                # Process runs
                runs = delivery.get('runs', {}).get('batter', 0)
                player_stats[batter]['runs'] += runs
                
                # Check for boundaries (4s and 6s)
                if runs == 4:
                    player_stats[batter]['fours'] += 1
                    # Store shot information
                    player_stats[batter]['shots'].append({
                        'type': 'four',
                        'angle': None,
                        'zone': get_zone_from_commentary(delivery)
                    })
                elif runs == 6:
                    player_stats[batter]['sixes'] += 1
                    player_stats[batter]['shots'].append({
                        'type': 'six',
                        'angle': None,
                        'zone': get_zone_from_commentary(delivery)
                    })
    
    # Update player names from registry if available
    if 'registry' in match_data.get('info', {}) and 'people' in match_data['info']['registry']:
        for player_id, player_info in player_stats.items():
            if player_id in match_data['info']['registry']['people']:
                player_info['name'] = player_id  # Using ID as name for now
    
    return player_stats, match_info

def get_zone_from_commentary(delivery):
    """Extract zone information from commentary if available"""
    # This is a simplified version - in a real implementation, you would 
    # parse commentary or use additional data to determine shot zone
    commentary = delivery.get('commentary', '')
    
    # Default zones based on common cricket field positions
    zones = ['Cover', 'Mid-wicket', 'Point', 'Fine Leg', 'Third Man', 
             'Long-on', 'Long-off', 'Deep Mid-wicket', 'Deep Square Leg']
    
    # In real implementation, you would analyze commentary to determine zone
    # For now, we'll return a placeholder
    return None  # Will be randomly assigned in the frontend

def should_update_data():
    """Check if the data should be updated (every 7 days)"""
    if not os.path.exists(LAST_UPDATE_FILE):
        return True
    
    try:
        with open(LAST_UPDATE_FILE, 'r') as f:
            last_updated = datetime.fromisoformat(f.read().strip())
        
        days_since_update = (datetime.now() - last_updated).days
        return days_since_update >= 7
    except Exception as e:
        print(f"Error checking last update time: {e}")
        return True  # If there's an error, update anyway

def main():
    
    
    all_player_stats = defaultdict(lambda: {'name': '', 'team': '', 'fours': 0, 'sixes': 0, 
                                           'shots': [], 'matches': 0, 'runs': 0})
    
    print("Processing match data files...")
    json_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json')]
    
    processed_count = 0
    for file_name in json_files:
        file_path = os.path.join(DATA_DIR, file_name)
        print(f"Processing {file_name}...")
        
        try:
            player_stats, match_info = process_match_data(file_path)
            
            # Skip if no relevant stats (not international/IPL)
            if not player_stats:
                continue
                
            processed_count += 1
            
            # Aggregate player statistics across matches
            for player_id, stats in player_stats.items():
                all_player_stats[player_id]['name'] = stats['name'] or player_id
                all_player_stats[player_id]['team'] = stats['team']
                all_player_stats[player_id]['fours'] += stats['fours']
                all_player_stats[player_id]['sixes'] += stats['sixes']
                all_player_stats[player_id]['shots'].extend(stats['shots'])
                all_player_stats[player_id]['matches'] += stats['matches']
                all_player_stats[player_id]['runs'] += stats['runs']
        
        except Exception as e:
            print(f"Error processing {file_name}: {e}")
    
    print(f"Processed {processed_count} international/IPL matches")
    
    # Calculate derived statistics
    for player_id, stats in all_player_stats.items():
        if stats['matches'] > 0:
            stats['average'] = round(stats['runs'] / stats['matches'], 2)
            
            # Calculate strike rate (assuming typical T20 format with ~20 balls faced per match)
            # In a real implementation, you would count actual balls faced
            estimated_balls = stats['matches'] * 20
            stats['strikeRate'] = round((stats['runs'] / estimated_balls) * 100, 2) if estimated_balls > 0 else 0
    
    # Convert to list and sort by total boundaries (fours + sixes)
    players_list = []
    for player_id, stats in all_player_stats.items():
        player_data = {
            'id': player_id,
            'name': stats['name'],
            'team': stats['team'],
            'matches': stats['matches'],
            'runs': stats['runs'],
            'average': stats.get('average', 0),
            'strikeRate': stats.get('strikeRate', 0),
            'fours': stats['fours'],
            'sixes': stats['sixes'],
            'shots': stats['shots']
        }
        players_list.append(player_data)
    
    # Sort by total boundaries (fours + sixes)
    players_list.sort(key=lambda x: (x['fours'] + x['sixes']), reverse=True)
    
    # Get top 10 players
    top_players = players_list[:15]
    
    # Save results to JSON file
    output_file = os.path.join(OUTPUT_DIR, 'top_players.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'topPlayers': top_players
        }, f, indent=2)
    
    # Update the last updated timestamp
    with open(LAST_UPDATE_FILE, 'w') as f:
        f.write(datetime.now().isoformat())
    
    print(f"Analysis complete. Results saved to {output_file}")
    print(f"Top 10 boundary hitters:")
    for i, player in enumerate(top_players, 1):
        print(f"{i}. {player['name']} ({player['team']}): {player['fours']} fours, {player['sixes']} sixes")

if __name__ == "__main__":
    main()