import os
import json
import math
from collections import defaultdict
from datetime import datetime

def calculate_team_stats():
    """
    Calculates team statistics from the downloaded cricsheet data
    Stores results in public/teamStats folder
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))

    input_dir = os.path.join(script_dir, '..', 'public', 'teamData')
    output_dir = os.path.join(script_dir, '..', 'public', 'teamStats')

    
    input_dir = os.path.abspath(input_dir)
    output_dir = os.path.abspath(output_dir)

    os.makedirs(output_dir, exist_ok=True)
    
    # Dictionary to store all team data
    all_teams_data = {
        "t20": defaultdict(lambda: create_default_team_stats()),
        "odi": defaultdict(lambda: create_default_team_stats()),
        "test": defaultdict(lambda: create_default_team_stats()),
        "ipl": defaultdict(lambda: create_default_team_stats())
    }
    
    # Process each format
    for format_name in ["t20", "odi", "test", "ipl"]:
        format_dir = os.path.join(input_dir, format_name)
        if not os.path.exists(format_dir):
            continue
            
        json_files = [f for f in os.listdir(format_dir) if f.endswith('.json')]
        
        for file_name in json_files:
            file_path = os.path.join(format_dir, file_name)
            process_match_file(file_path, format_name, all_teams_data)
    
    # Calculate derived statistics
    for format_name in all_teams_data:
        for team_name in all_teams_data[format_name]:
            team_data = all_teams_data[format_name][team_name]
            
            # Calculate batting averages and strike rates
            for player in team_data["players"]:
                player_stats = team_data["players"][player]
                
                # Batting stats
                if player_stats["batting"]["dismissals"] > 0:
                    player_stats["batting"]["average"] = round(player_stats["batting"]["runs"] / player_stats["batting"]["dismissals"], 2)
                if player_stats["batting"]["balls_faced"] > 0:
                    player_stats["batting"]["strike_rate"] = round((player_stats["batting"]["runs"] / player_stats["batting"]["balls_faced"]) * 100, 2)
                
                # Bowling stats
                if player_stats["bowling"]["wickets"] > 0:
                    player_stats["bowling"]["average"] = round(player_stats["bowling"]["runs_conceded"] / player_stats["bowling"]["wickets"], 2)
                if player_stats["bowling"]["balls_bowled"] > 0:
                    player_stats["bowling"]["economy"] = round((player_stats["bowling"]["runs_conceded"] / player_stats["bowling"]["balls_bowled"]) * 6, 2)
                    if player_stats["bowling"]["wickets"] > 0:
                        player_stats["bowling"]["strike_rate"] = round(player_stats["bowling"]["balls_bowled"] / player_stats["bowling"]["wickets"], 2)
            
            # Identify team strengths
            identify_team_strengths(team_data)
    
    # Save results
    for format_name in all_teams_data:
        format_output = {}
        for team_name, team_data in all_teams_data[format_name].items():
            format_output[team_name] = team_data
        
        output_file = os.path.join(output_dir, f"{format_name}_stats.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(format_output, f, indent=2)
    
    # Save a summary of all formats
    summary = {}
    for format_name in all_teams_data:
        summary[format_name] = {}
        for team_name in all_teams_data[format_name]:
            team_data = all_teams_data[format_name][team_name]
            summary[format_name][team_name] = {
                "matches_played": team_data["matches_played"],
                "matches_won": team_data["matches_won"],
                "win_percentage": team_data["win_percentage"],
                "strengths": team_data["strengths"]
            }
    
    summary_file = os.path.join(output_dir, "summary.json")
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    # Update timestamp
    with open(os.path.join(output_dir, 'last_updated.txt'), 'w') as f:
        f.write(datetime.now().isoformat())
    
    print("Team statistics calculated and saved successfully!")

def create_default_team_stats():
    """Creates a default structure for team statistics"""
    return {
        "matches_played": 0,
        "matches_won": 0,
        "win_percentage": 0,
        "total_runs_scored": 0,
        "total_wickets_taken": 0,
        "total_runs_conceded": 0,
        "total_wickets_lost": 0,
        "players": {},
        "strengths": []
    }

def process_match_file(file_path, format_name, all_teams_data):
    """Process a single match file and update team statistics"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            match_data = json.load(f)
        
        info = match_data.get("info", {})
        teams = info.get("teams", [])
        if len(teams) != 2:
            return
        
        team1, team2 = teams
        winner = info.get("outcome", {}).get("winner")
        
        # Update matches played
        all_teams_data[format_name][team1]["matches_played"] += 1
        all_teams_data[format_name][team2]["matches_played"] += 1
        
        # Update matches won
        if winner == team1:
            all_teams_data[format_name][team1]["matches_won"] += 1
        elif winner == team2:
            all_teams_data[format_name][team2]["matches_won"] += 1
        
        # Calculate win percentage
        for team in [team1, team2]:
            team_data = all_teams_data[format_name][team]
            if team_data["matches_played"] > 0:
                team_data["win_percentage"] = round((team_data["matches_won"] / team_data["matches_played"]) * 100, 2)
        
        # Process innings data
        innings = match_data.get("innings", [])
        for inning in innings:
            batting_team = inning.get("team")
            bowling_team = team2 if batting_team == team1 else team1
            
            # Skip if team is not found
            if batting_team not in teams or bowling_team not in teams:
                continue
            
            total_runs = 0
            total_wickets = 0
            
            # Process deliveries - Fixed to match Cricsheet JSON format
            overs = inning.get("overs", [])
            for over_data in overs:
                over_number = over_data.get("over")
                deliveries = over_data.get("deliveries", [])
                
                for delivery in deliveries:
                    # Get batsman and bowler info
                    batsman = delivery.get("batter")
                    bowler = delivery.get("bowler")
                    runs = delivery.get("runs", {}).get("batter", 0)
                    extras = delivery.get("runs", {}).get("extras", 0)
                    total_delivery_runs = runs + extras
                    
                    # Update total runs
                    total_runs += total_delivery_runs
                    
                    # Check for wickets
                    wickets = delivery.get("wickets", [])  # Changed to handle array of wickets
                    
                    # If wickets is a dictionary, convert to list for consistent handling
                    if isinstance(wickets, dict):
                        wickets = [wickets]
                        
                    for wicket in wickets:
                        if wicket:  # If there is a wicket on this delivery
                            total_wickets += 1
                            player_out = wicket.get("player_out")
                            
                            # Update player dismissal
                            if player_out:
                                ensure_player_exists(all_teams_data[format_name][batting_team]["players"], player_out)
                                all_teams_data[format_name][batting_team]["players"][player_out]["batting"]["dismissals"] += 1
                                
                            # Update bowler wickets (only if it's a bowler-credited wicket)
                            kind = wicket.get("kind", "")
                            if bowler and kind in ["bowled", "caught", "lbw", "caught and bowled", "stumped"]:
                                ensure_player_exists(all_teams_data[format_name][bowling_team]["players"], bowler)
                                all_teams_data[format_name][bowling_team]["players"][bowler]["bowling"]["wickets"] += 1
                    
                    # Update batsman stats
                    if batsman:
                        ensure_player_exists(all_teams_data[format_name][batting_team]["players"], batsman)
                        player_stats = all_teams_data[format_name][batting_team]["players"][batsman]["batting"]
                        player_stats["innings"] += 1
                        player_stats["runs"] += runs
                        player_stats["balls_faced"] += 1
                        
                        # Track boundaries
                        if runs == 4:
                            player_stats["fours"] += 1
                        elif runs == 6:
                            player_stats["sixes"] += 1
                    
                    # Update bowler stats
                    if bowler:
                        ensure_player_exists(all_teams_data[format_name][bowling_team]["players"], bowler)
                        player_stats = all_teams_data[format_name][bowling_team]["players"][bowler]["bowling"]
                        player_stats["overs"] += 1/6  # Add 1/6 of an over per delivery
                        player_stats["runs_conceded"] += total_delivery_runs
                        player_stats["balls_bowled"] += 1
            
            # Update team totals
            all_teams_data[format_name][batting_team]["total_runs_scored"] += total_runs
            all_teams_data[format_name][batting_team]["total_wickets_lost"] += total_wickets
            all_teams_data[format_name][bowling_team]["total_runs_conceded"] += total_runs
            all_teams_data[format_name][bowling_team]["total_wickets_taken"] += total_wickets
            
        # After processing all innings, identify player roles
        for team in teams:
            identify_player_roles(all_teams_data[format_name][team]["players"])
    
    except Exception as e:
        print(f"Error processing match file {file_path}: {str(e)}")
        import traceback
        traceback.print_exc() 
     
def ensure_player_exists(players_dict, player_name):
    """Ensures a player exists in the players dictionary"""
    if player_name not in players_dict:
        players_dict[player_name] = {
            "role": "Unknown",
            "batting": {
                "innings": 0,
                "runs": 0,
                "balls_faced": 0,
                "dismissals": 0,
                "average": 0,
                "strike_rate": 0,
                "fours": 0,
                "sixes": 0
            },
            "bowling": {
                "overs": 0,
                "runs_conceded": 0,
                "wickets": 0,
                "economy": 0,
                "average": 0,
                "strike_rate": 0,
                "balls_bowled": 0
            }
        }

def identify_player_roles(players):
    """Identifies player roles based on their stats"""
    for player_name, stats in players.items():
        batting = stats["batting"]
        bowling = stats["bowling"]
        
        # Adjust thresholds to be more inclusive
        is_batting_contributor = batting["balls_faced"] >= 5  # Lower threshold
        is_bowling_contributor = bowling["balls_bowled"] >= 6  # Lower threshold (1 over)
        
        # Check if player contributes more significantly to one discipline
        batting_contribution = batting["runs"] + (batting["fours"] * 2) + (batting["sixes"] * 3)
        bowling_contribution = (bowling["wickets"] * 15) + (bowling["balls_bowled"] / 2)
        
        # Assign role based on contributions
        if is_batting_contributor and is_bowling_contributor:
            # This is a player who both bats and bowls - likely an all-rounder
            stats["role"] = "All-rounder"
        elif is_batting_contributor:
            # Only batting contribution
            stats["role"] = "Batsman"
        elif is_bowling_contributor:
            # Only bowling contribution
            stats["role"] = "Bowler"
        else:
            # Not enough data to classify
            stats["role"] = "Unknown"
        
        # Override for clear specialists
        if stats["role"] == "All-rounder":
            # Check if they're actually specialists who just bowled/batted a little
            if batting_contribution > (bowling_contribution * 5) and batting["innings"] >= 2:
                stats["role"] = "Batsman"
            elif bowling_contribution > (batting_contribution * 3) and bowling["overs"] >= 2:
                stats["role"] = "Bowler"

def identify_team_strengths(team_data):
    """Identifies team strengths based on statistics"""
    strengths = []
    
    # Check win rate
    if team_data["win_percentage"] >= 60:
        strengths.append("High win rate")
    
    # Check batting strength
    top_batsmen = []
    for player, stats in team_data["players"].items():
        if stats["role"] in ["Batsman", "All-rounder"] and stats["batting"]["average"] >= 30:
            top_batsmen.append(player)
    
    if len(top_batsmen) >= 3:
        strengths.append("Strong batting lineup")
    
    # Check bowling strength
    top_bowlers = []
    for player, stats in team_data["players"].items():
        if stats["role"] in ["Bowler", "All-rounder"] and stats["bowling"]["economy"] <= 7:
            top_bowlers.append(player)
    
    if len(top_bowlers) >= 3:
        strengths.append("Strong bowling attack")
    
    # Check all-rounders
    all_rounders = [player for player, stats in team_data["players"].items() if stats["role"] == "All-rounder"]
    if len(all_rounders) >= 2:
        strengths.append("Good all-rounders")
    
    # Check boundaries
    total_fours = sum(stats["batting"]["fours"] for stats in team_data["players"].values())
    total_sixes = sum(stats["batting"]["sixes"] for stats in team_data["players"].values())
    
    if total_sixes >= 20:
        strengths.append("Strong six-hitting ability")
    
    # Store strengths
    team_data["strengths"] = strengths

if __name__ == "__main__":
    calculate_team_stats()
    print("Team statistics calculated successfully!")