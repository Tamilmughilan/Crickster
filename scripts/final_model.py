import pandas as pd
import numpy as np
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.metrics import accuracy_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import glob
from visualizations import create_visualizations

# Paths to data files
base_path = "./public"
processed_data_path = os.path.join(base_path, "processed_data2.csv")
matches_json_path = os.path.join(base_path, "matches.json")
player_data_path = os.path.join(base_path, "player_data")
prediction_output_path = os.path.join(base_path, "model/predictions.json")
visualizations_output_path = os.path.join(base_path, "visualizations")

def load_datasets():
    """Load the training and testing datasets"""
    print("Loading datasets...")
    
    # Load training data
    train_data = pd.read_csv(processed_data_path)
    
    # Load test data (upcoming matches)
    with open(matches_json_path, 'r') as f:
        test_data = json.load(f)
    
    # Load player metadata
    player_metadata = pd.read_csv(os.path.join(player_data_path, "metadata.csv"))
    
    # Load player statistics (sample - we'll do more comprehensive loading later)
    odi_batting = pd.read_csv(os.path.join(player_data_path, "odi", "odi_batting.csv"))
    odi_bowling = pd.read_csv(os.path.join(player_data_path, "odi", "odi_bowling.csv"))
    odi_fielding = pd.read_csv(os.path.join(player_data_path, "odi", "odi_fielding.csv"))
    odi_all_round = pd.read_csv(os.path.join(player_data_path, "odi", "odi_all_round.csv"))
    
    print(f"Training data shape: {train_data.shape}")
    print(f"Test data (upcoming matches): {len(test_data)}")
    
    return train_data, test_data, player_metadata, {
        'odi_batting': odi_batting,
        'odi_bowling': odi_bowling, 
        'odi_fielding': odi_fielding,
        'odi_all_round': odi_all_round
    }

def load_all_player_stats():
    """Load all player statistics from different formats"""
    player_stats = {}
    
    # Define formats and stat types
    formats = ['odi', 't20', 'test']
    stat_types = ['batting', 'bowling', 'fielding', 'all_round']
    
    # Load regular stats
    for format_type in formats:
        format_path = os.path.join(player_data_path, format_type)
        if os.path.exists(format_path):
            for stat_type in stat_types:
                file_path = os.path.join(format_path, f"{format_type}_{stat_type}.csv")
                if os.path.exists(file_path):
                    key = f"{format_type}_{stat_type}"
                    player_stats[key] = pd.read_csv(file_path)
    
    # Load recent form stats
    recent_form_path = os.path.join(player_data_path, "recent_form")
    if os.path.exists(recent_form_path):
        for format_type in formats:
            recent_path = os.path.join(recent_form_path, format_type)
            if os.path.exists(recent_path):
                for stat_type in stat_types:
                    file_path = os.path.join(recent_path, f"{format_type}_{stat_type}.csv")
                    if os.path.exists(file_path):
                        key = f"recent_{format_type}_{stat_type}"
                        player_stats[key] = pd.read_csv(file_path)
    
    return player_stats

def extract_team_stats_from_players(player_details, player_stats, format_type='odi'):
    """Extract team statistics based on player details with focus on key predictive features"""
    team_stats = {
        'batting_average': 0,
        'batting_strike_rate': 0,
        'bowling_average': 0,
        'bowling_strike_rate': 0,
        'economy': 0,
        'all_round_index': 0,
        'total_runs': 0,
        'total_wickets': 0
    }
    
    # Convert format type to lowercase to match file naming
    format_type = format_type.lower()
    if format_type == 'international':
        format_type = 'odi'  # Default to ODI for international matches
    
    # Also try to use stats from other formats if the specific format isn't available
    # Order of preference: exact format -> t20 -> odi -> test
    format_preference = [format_type]
    if format_type != 't20':
        format_preference.append('t20')  # T20 stats seem important in your model
    if format_type != 'odi':
        format_preference.append('odi')
    if format_type != 'test':
        format_preference.append('test')
    
    # Rest of the function remains similar, but try each format in preference order
    # when looking up player stats... # Default to ODI for international matches
    
    batting_key = f"{format_type}_batting"
    bowling_key = f"{format_type}_bowling"
    all_round_key = f"{format_type}_all_round"
    
    # Count how many players we found stats for
    batting_count = 0
    bowling_count = 0
    all_round_count = 0
    
    for player in player_details:
        player_name = player['name']
        full_name = player.get('fullName', player_name)
        
        # Try both the name and full name for matching
        names_to_try = [player_name, full_name]
        
        # Look for matching player in batting stats
        if batting_key in player_stats:
            batting_df = player_stats[batting_key]
            
            for name in names_to_try:
                player_batting = batting_df[batting_df['player'].str.contains(name, case=False, na=False)]
                if not player_batting.empty:
                    for stat in ['batting_average', 'strike_rate']:
                        if stat in player_batting.columns:
                            stat_value = player_batting[stat].values[0]
                            # Convert to float and handle non-numeric values
                            try:
                                stat_value = float(stat_value)
                                # Handle infinity or very large values (cap at reasonable maximum)
                                if stat == 'batting_average':
                                    if np.isinf(stat_value) or stat_value > 100:
                                        stat_value = 50  # Cap at reasonable maximum
                                    team_stats['batting_average'] += stat_value
                                elif stat == 'strike_rate':
                                    if np.isinf(stat_value) or stat_value > 250:
                                        stat_value = 100  # Cap at reasonable maximum
                                    team_stats['batting_strike_rate'] += stat_value
                            except (ValueError, TypeError):
                                # If value can't be converted to float, skip it
                                continue
                    
                    # Add runs if available
                    if 'runs' in player_batting.columns:
                        try:
                            runs = float(player_batting['runs'].values[0])
                            team_stats['total_runs'] += runs
                        except (ValueError, TypeError):
                            pass
                    
                    batting_count += 1
                    break  # Found a match, no need to check other name variations
        
        # Look for matching player in bowling stats
        if bowling_key in player_stats:
            bowling_df = player_stats[bowling_key]
            
            for name in names_to_try:
                player_bowling = bowling_df[bowling_df['player'].str.contains(name, case=False, na=False)]
                if not player_bowling.empty:
                    for stat in ['bowling_average', 'bowling_strike_rate', 'economy']:
                        if stat in player_bowling.columns:
                            try:
                                stat_value = float(player_bowling[stat].values[0])
                                # Handle infinity or very large values
                                if np.isinf(stat_value) or stat_value > 100:
                                    if stat == 'bowling_average':
                                        stat_value = 30  # Cap at reasonable value
                                    elif stat == 'bowling_strike_rate':
                                        stat_value = 50  # Cap at reasonable value
                                    elif stat == 'economy':
                                        stat_value = 8  # Cap at reasonable value
                                
                                team_stats[stat] += stat_value
                            except (ValueError, TypeError):
                                continue
                    
                    # Add wickets if available
                    if 'wickets' in player_bowling.columns:
                        try:
                            wickets = float(player_bowling['wickets'].values[0])
                            team_stats['total_wickets'] += wickets
                        except (ValueError, TypeError):
                            pass
                    
                    bowling_count += 1
                    break  # Found a match, no need to check other name variations
        
        # Look for matching player in all-round stats
        if all_round_key in player_stats:
            all_round_df = player_stats[all_round_key]
            
            for name in names_to_try:
                player_all_round = all_round_df[all_round_df['player'].str.contains(name, case=False, na=False)]
                if not player_all_round.empty:
                    if 'all_round_index' in player_all_round.columns:
                        try:
                            all_round_index = float(player_all_round['all_round_index'].values[0])
                            team_stats['all_round_index'] += all_round_index
                        except (ValueError, TypeError):
                            pass
                    all_round_count += 1
                    break  # Found a match, no need to check other name variations
    
    # Calculate averages for the team
    if batting_count > 0:
        team_stats['batting_average'] /= batting_count
        team_stats['batting_strike_rate'] /= batting_count
    
    if bowling_count > 0:
        team_stats['bowling_average'] /= bowling_count
        team_stats['bowling_strike_rate'] /= bowling_count
        team_stats['economy'] /= bowling_count
    
    if all_round_count > 0:
        team_stats['all_round_index'] /= all_round_count
    
    return team_stats

def extract_features_from_processed_data(processed_data, player_stats, format_type='odi'):
    """
    Extract player-based features from processed data to align with prediction phase.
    This uses team names from the processed data to create dummy player rosters
    and then generate consistent stats.
    """
    print("Extracting player-based features for training data...")
    
    # Get unique teams in the dataset
    unique_teams = set(processed_data['team_1'].unique()).union(set(processed_data['team_2'].unique()))
    
    # Create a mapping of teams to their top players from player statistics
    team_to_players = {}
    
    # Create a lookup dataframe mapping players to teams
    player_team_mapping = pd.DataFrame()
    for stat_type in ['batting', 'bowling', 'all_round']:
        key = f"{format_type}_{stat_type}"
        if key in player_stats:
            if 'team' in player_stats[key].columns and 'player' in player_stats[key].columns:
                player_team_df = player_stats[key][['player', 'team']].drop_duplicates()
                player_team_mapping = pd.concat([player_team_mapping, player_team_df])
    
    player_team_mapping = player_team_mapping.drop_duplicates().reset_index(drop=True)
    
    # Create dummy player rosters for each team
    for team in unique_teams:
        team_players = player_team_mapping[player_team_mapping['team'].str.contains(team, case=False, na=False)]
        
        # If we can't find players for this team, create empty roster
        if team_players.empty:
            team_to_players[team] = []
        else:
            # Take top 11 players (or as many as we have)
            top_players = team_players['player'].iloc[:min(11, len(team_players))].tolist()
            team_to_players[team] = [{'name': player} for player in top_players]
    
    # Add player-based features to the training data
    enhanced_data = processed_data.copy()
    
    # Add player-based stats for each match
    for idx, row in enhanced_data.iterrows():
        team1 = row['team_1']
        team2 = row['team_2']
        
        # Extract player details for each team
        team1_players = team_to_players.get(team1, [])
        team2_players = team_to_players.get(team2, [])
        
        # Calculate team stats based on player details
        if team1_players:
            team1_stats = extract_team_stats_from_players(team1_players, player_stats, format_type)
            for stat, value in team1_stats.items():
                enhanced_data.at[idx, f'{stat}_{format_type}_team_1_from_players'] = value
        
        if team2_players:
            team2_stats = extract_team_stats_from_players(team2_players, player_stats, format_type)
            for stat, value in team2_stats.items():
                enhanced_data.at[idx, f'{stat}_{format_type}_team_2_from_players'] = value
    
    # Fill NaN values for the new columns
    player_stat_cols = [col for col in enhanced_data.columns if col.endswith('_from_players')]
    if player_stat_cols:
        # For each player-based stat, copy values from corresponding pre-calculated stats if available
        for col in player_stat_cols:
            base_col = col.replace('_from_players', '')
            if base_col in enhanced_data.columns:
                # Fill missing player-based stats with existing pre-calculated stats
                enhanced_data[col].fillna(enhanced_data[base_col], inplace=True)
            else:
                # Fill remaining NaNs with 0
                enhanced_data[col].fillna(0, inplace=True)
    
    print(f"Enhanced training data with player-based features: {enhanced_data.shape}")
    return enhanced_data

def clean_training_data(train_data):
    """Clean and prepare the training data"""
    print("Cleaning training data...")
    
    # Select essential columns, prioritizing performance metrics across all formats
    essential_columns = [
        'match_id', 'date', 'team_1', 'team_2', 'winner', 'match_type', 'venue', 'city',
        'toss_winner', 'toss_decision', 'team_1_win_percentage', 'team_2_win_percentage'
    ]
    
    # Add format-specific team performance columns with priority on T20 (based on top features)
    # The order matters for feature importance consideration
    for format_type in ['t20', 'odi', 'test']:  # Reordered to prioritize T20 based on your results
        for team_num in ['1', '2']:
            # Add batting stats first (batting_avg was in top features)
            for stat in ['batting_average', 'batting_strike_rate', 'total_runs']:
                col = f"{stat}_{format_type}_team_{team_num}"
                if col in train_data.columns:
                    essential_columns.append(col)
                player_col = f"{stat}_{format_type}_team_{team_num}_from_players"
                if player_col in train_data.columns:
                    essential_columns.append(player_col)
            
            # Add bowling stats next (bowling_avg was in top features)
            for stat in ['bowling_average', 'bowling_strike_rate', 'economy']:
                col = f"{stat}_{format_type}_team_{team_num}"
                if col in train_data.columns:
                    essential_columns.append(col)
                player_col = f"{stat}_{format_type}_team_{team_num}_from_players"
                if player_col in train_data.columns:
                    essential_columns.append(player_col)
            
            # Add all-round and total wickets stats last
            for stat in ['all_round_index', 'total_wickets']:
                col = f"{stat}_{format_type}_team_{team_num}"
                if col in train_data.columns:
                    essential_columns.append(col)
                player_col = f"{stat}_{format_type}_team_{team_num}_from_players"
                if player_col in train_data.columns:
                    essential_columns.append(player_col)
    
    # Add venue category which was in top features
    if 'venue_category' in train_data.columns:
        essential_columns.append('venue_category')
    
    # Rest of the function remains the same...
    
    # Filter columns that exist in the dataframe
    existing_columns = [col for col in essential_columns if col in train_data.columns]
    
    # Select only these columns
    cleaned_data = train_data[existing_columns].copy()
    
    # Handle missing values for numerical columns
    numerical_cols = cleaned_data.select_dtypes(include=['float64', 'int64']).columns
    cleaned_data[numerical_cols] = cleaned_data[numerical_cols].fillna(0)
    
    # Handle missing values for categorical columns
    categorical_cols = cleaned_data.select_dtypes(include=['object']).columns
    cleaned_data[categorical_cols] = cleaned_data[categorical_cols].fillna('Unknown')
    
    # Create a binary target variable (1 if team_1 wins, 0 otherwise)
    cleaned_data['team_1_won'] = (cleaned_data['winner'] == cleaned_data['team_1']).astype(int)
    
    # Remove rows with missing winners
    cleaned_data = cleaned_data.dropna(subset=['winner'])
    
    # Filter only for matches with the format in the test data (ODI for ICC Champions Trophy)
    if 'match_type' in cleaned_data.columns:
        cleaned_data = cleaned_data[cleaned_data['match_type'].str.contains('ODI', case=False, na=False)]
    
    # Convert string columns to category for lighter memory usage
    categorical_cols = ['team_1', 'team_2', 'winner', 'venue', 'city', 'match_type', 
                        'toss_winner', 'toss_decision']
    if 'venue_category' in cleaned_data.columns:
        categorical_cols.append('venue_category')
    
    for col in categorical_cols:
        if col in cleaned_data.columns:
            cleaned_data[col] = cleaned_data[col].astype('category')
    
    print(f"Cleaned training data shape: {cleaned_data.shape}")
    return cleaned_data

def prepare_test_data(test_data, player_stats, train_data):
    """Prepare test data (upcoming matches) for prediction"""
    print("Preparing test data...")
    
    test_features = []
    
    for match in test_data:
        match_info = match['details']['matchInfo']
        venue_info = match['details'].get('venueInfo', {})
        
        # Extract basic match information
        match_dict = {
            'match_id': match_info['matchId'],
            'team_1': match_info['team1']['name'],
            'team_2': match_info['team2']['name'],
            'venue': match_info['venue']['name'],
            'city': match_info['venue']['city'],
            'match_type': match_info['matchFormat'],
        }
        
        # Add toss information if available (might be unknown for future matches)
        if 'toss' in match_info:
            match_dict['toss_winner'] = match_info['toss'].get('winner', '')
            match_dict['toss_decision'] = match_info['toss'].get('decision', '')
        
        # Extract team 1 player details and calculate team stats
        team1_players = match_info['team1']['playerDetails']
        team1_stats = extract_team_stats_from_players(team1_players, player_stats, 
                                                     format_type=match_info['matchFormat'])
        
        # Extract team 2 player details and calculate team stats
        team2_players = match_info['team2']['playerDetails']
        team2_stats = extract_team_stats_from_players(team2_players, player_stats,
                                                     format_type=match_info['matchFormat'])
        
        # Add team stats to match dictionary
        format_type = match_info['matchFormat'].lower()
        if format_type == 'international':
            format_type = 'odi'  # Default
            
        for stat, value in team1_stats.items():
            # Use the same column names as in training data with player-derived suffix
            match_dict[f'{stat}_{format_type}_team_1_from_players'] = value
        
        for stat, value in team2_stats.items():
            # Use the same column names as in training data with player-derived suffix
            match_dict[f'{stat}_{format_type}_team_2_from_players'] = value
        
        # Add historical win percentages if available in training data
        team1_name = match_dict['team_1']
        team2_name = match_dict['team_2']
        
        # Calculate historical win percentages from training data
        team1_matches = train_data[(train_data['team_1'] == team1_name) | (train_data['team_2'] == team1_name)]
        
        # Fix Boolean Series key reindexing warning by properly filtering
        team1_wins_condition1 = (train_data['team_1'] == team1_name) & (train_data['winner'] == team1_name)
        team1_wins_condition2 = (train_data['team_2'] == team1_name) & (train_data['winner'] == team1_name)
        team1_wins = len(train_data[team1_wins_condition1 | team1_wins_condition2])
        
        team2_matches = train_data[(train_data['team_1'] == team2_name) | (train_data['team_2'] == team2_name)]
        
        # Fix Boolean Series key reindexing warning by properly filtering
        team2_wins_condition1 = (train_data['team_1'] == team2_name) & (train_data['winner'] == team2_name)
        team2_wins_condition2 = (train_data['team_2'] == team2_name) & (train_data['winner'] == team2_name)
        team2_wins = len(train_data[team2_wins_condition1 | team2_wins_condition2])
        
        if len(team1_matches) > 0:
            match_dict['team_1_win_percentage'] = team1_wins / len(team1_matches) * 100
        else:
            match_dict['team_1_win_percentage'] = 50  # Default if no history
            
        if len(team2_matches) > 0:
            match_dict['team_2_win_percentage'] = team2_wins / len(team2_matches) * 100
        else:
            match_dict['team_2_win_percentage'] = 50  # Default if no history
        
        # Add venue category if available
        venue_name = match_dict['venue']
        venue_data = train_data[train_data['venue'] == venue_name]
        if 'venue_category' in train_data.columns and not venue_data.empty:
            match_dict['venue_category'] = venue_data['venue_category'].mode()[0]
        else:
            match_dict['venue_category'] = 'Neutral'  # Default if no category found
            
        test_features.append(match_dict)
    
    test_df = pd.DataFrame(test_features)
    print(f"Test data prepared with shape: {test_df.shape}")
    
    return test_df

def align_feature_columns(test_data, train_columns):
    """Ensure test data has the same columns as training data"""
    # Add missing columns from training data to test data
    for col in train_columns:
        if col not in test_data.columns:
            test_data[col] = 0  # Default value
    
    # Remove extra columns from test data
    test_data = test_data[train_columns]
    
    return test_data

def train_model(train_data):
    """Train a prediction model using processed training data"""
    print("Training prediction model...")
    
    # Identify high-importance categorical and numerical columns based on your results
    high_importance_cols = [
        'toss_decision',               # Highest importance from results
        'venue_category',              # High importance from results
        'batting_average_t20_team_1',  # From top features
        'batting_strike_rate_t20_team_1',
        'team_1_win_percentage', 
        'team_2_win_percentage',
        'batting_average_odi_team_1',
        'bowling_average_test_team_1',
        'city'                         # city_Unknown was important
    ]
    
    # Standard categorical columns
    categorical_cols = ['venue', 'city', 'toss_decision']
    
    # Add venue_category if it exists
    if 'venue_category' in train_data.columns:
        categorical_cols.append('venue_category')
    
    # Exclude non-feature columns
    non_feature_cols = ['match_id', 'date', 'team_1', 'team_2', 'winner', 
                        'toss_winner', 'match_type', 'team_1_won']
    
    # Filter out non-existent columns
    categorical_cols = [col for col in categorical_cols if col in train_data.columns]
    non_feature_cols = [col for col in non_feature_cols if col in train_data.columns]
    
    # Numerical columns are all columns except categorical and non-features
    numerical_cols = [col for col in train_data.columns 
                      if col not in categorical_cols and col not in non_feature_cols]
    
    # Create a RandomForestClassifier with better hyperparameters
    classifier = RandomForestClassifier(
        n_estimators=200,           # Increased from 100
        max_depth=20,               # Control tree depth
        min_samples_split=5,        # Min samples required to split
        min_samples_leaf=2,         # Min samples required at leaf
        bootstrap=True,             # Use bootstrap samples
        class_weight='balanced',    # Handle class imbalance
        random_state=42
    )
    
    # Rest of the function remains mostly the same with preprocessing... 
    # Prepare preprocessing pipeline
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean'))
    ])
    
    # Create preprocessor with non-empty transformers
    transformers = []
    if numerical_cols:
        transformers.append(('num', numerical_transformer, numerical_cols))
    if categorical_cols:
        transformers.append(('cat', categorical_transformer, categorical_cols))
    
    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder='drop'  # Drop any columns not specified
    )
    
    # Create the model pipeline
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    # Target variable
    y = train_data['team_1_won']
    
    # Features - drop non-feature columns
    X = train_data.drop(non_feature_cols, axis=1)
    
    # Train-validation split
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Fit the model
    model.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_val)
    accuracy = accuracy_score(y_val, y_pred)
    print(f"Model validation accuracy: {accuracy:.4f}")
    
    # Get feature importance if available
    if hasattr(model['classifier'], 'feature_importances_'):
        try:
            # Get feature names after preprocessing if possible
            feature_names = []
            try:
                # For scikit-learn >= 1.0
                if hasattr(model['preprocessor'], 'get_feature_names_out'):
                    feature_names = model['preprocessor'].get_feature_names_out()
                else:
                    # For older scikit-learn versions
                    for name, transformer, cols in model['preprocessor'].transformers_:
                        if not cols:
                            continue
                        if hasattr(transformer, 'get_feature_names_out'):
                            if name == 'cat':
                                feature_names.extend(transformer.get_feature_names_out(cols))
                            else:
                                feature_names.extend(cols)
                        elif hasattr(transformer, 'get_feature_names'):
                            if name == 'cat':
                                feature_names.extend(transformer.get_feature_names(cols))
                            else:
                                feature_names.extend(cols)
                        else:
                            feature_names.extend(cols)
            except Exception as e:
                print(f"Warning: Could not get feature names: {e}")
                feature_names = [f'Feature_{i}' for i in range(len(model['classifier'].feature_importances_))]
            
            feature_importance = pd.DataFrame({
                'Feature': feature_names,
                'Importance': model['classifier'].feature_importances_
            }).sort_values(by='Importance', ascending=False)
            
            print("Top 10 important features:")
            print(feature_importance.head(10))
        except Exception as e:
            print(f"Warning: Could not create feature importance dataframe: {e}")
    
    return model, X.columns.tolist()

def predict_matches(model, test_data, feature_cols):
    """Make predictions on upcoming matches"""
    print("Making predictions on upcoming matches...")
    
    # Align test data columns with training feature columns
    X_test = align_feature_columns(test_data, feature_cols)
    
    # Make predictions
    team1_win_prob = model.predict_proba(X_test)[:, 1]
    
    # Add predictions to test data
    test_data['team_1_win_probability'] = team1_win_prob
    test_data['team_2_win_probability'] = 1 - team1_win_prob
    
    # Format results for display
    results = []
    for _, match in test_data.iterrows():
        result = {
            'Match': f"{match['team_1']} vs {match['team_2']}",
            'Venue': f"{match['venue']}, {match['city']}",
            'Format': match['match_type'],
            'Prediction': {
                match['team_1']: f"{match['team_1_win_probability'] * 100:.2f}%",
                match['team_2']: f"{match['team_2_win_probability'] * 100:.2f}%"
            }
        }
        results.append(result)
    
    return results

def save_predictions_to_json(predictions, test_data, output_path):
    """Save predictions to JSON file for frontend use"""
    print(f"Saving predictions to {output_path}...")
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Format predictions for JSON
    formatted_predictions = []
    for pred in predictions:
        match_id = None
        for _, match_row in test_data.iterrows():
            if (f"{match_row['team_1']} vs {match_row['team_2']}" == pred['Match'] and 
                match_row['venue'] in pred['Venue']):
                match_id = match_row['match_id']
                break
        
        # Safely get the team names from prediction keys
        prediction_keys = list(pred['Prediction'].keys())
        team1 = prediction_keys[0] if prediction_keys else "Unknown"
        team2 = prediction_keys[1] if len(prediction_keys) > 1 else "Unknown"
        
        formatted_pred = {
            "match_id": match_id,
            "teams": {
                "team1": team1,
                "team2": team2
            },
            "probabilities": {
                team1: float(pred['Prediction'].get(team1, "0").strip('%')) if team1 != "Unknown" else 0,
                team2: float(pred['Prediction'].get(team2, "0").strip('%')) if team2 != "Unknown" else 0
            },
            "venue": pred['Venue'],
            "format": pred['Format']
        }
        formatted_predictions.append(formatted_pred)
    
    # Write to JSON file
    with open(output_path, 'w') as f:
        json.dump(formatted_predictions, f, indent=2)
    
    print(f"Saved {len(formatted_predictions)} prediction results to {output_path}")
def main():
    # Set pandas options to display more columns
    pd.set_option('display.max_columns', 100)
    
    # Load datasets
    train_data, test_data, player_metadata, player_stats_sample = load_datasets()
    
    # Load all player statistics
    player_stats = load_all_player_stats()
    
    # Check if player_stats has the required columns before enhancing data
    has_team_column = False
    
    # Default format type - try to detect from test data first
    format_type = 'odi'  # Default
    
    # Analyze what format the test matches are in
    match_formats = []
    for match in test_data:
        match_info = match['details']['matchInfo']
        if 'matchFormat' in match_info:
            match_formats.append(match_info['matchFormat'].lower())
    
    # If most matches are T20, use that as primary format
    if match_formats and match_formats.count('t20') > len(match_formats)/2:
        format_type = 't20'
    
    # Check if any of the dataframes in player_stats has a 'team' column
    for key, df in player_stats.items():
        if 'team' in df.columns:
            has_team_column = True
            break
    
    # Rest of the function remains similar...
    
    if has_team_column:
        # Enhance training data with player-based features
        enhanced_train_data = extract_features_from_processed_data(train_data, player_stats, format_type)
    else:
        print("Warning: No 'team' column found in player statistics. Skipping player-based feature extraction.")
        enhanced_train_data = train_data.copy()
    
    # Clean training data
    cleaned_train_data = clean_training_data(enhanced_train_data)
    
    # Prepare test data
    prepared_test_data = prepare_test_data(test_data, player_stats, cleaned_train_data)
    
    # Train prediction model
    try:
        model, feature_cols = train_model(cleaned_train_data)
        
        # Make predictions
        # In your main function, after making predictions:
        predictions = predict_matches(model, prepared_test_data, feature_cols)
                
        # Save predictions to JSON for frontend use
        save_predictions_to_json(predictions,prepared_test_data, prediction_output_path)
                
        # Create and save visualizations
        create_visualizations(model, feature_cols, cleaned_train_data, prepared_test_data, visualizations_output_path)

        # Display predictions
        print("\nMatch Predictions:")
        for pred in predictions:
            print(f"\n{pred['Match']} at {pred['Venue']} ({pred['Format']})")
            print("Win Probability:")
            for team, probability in pred['Prediction'].items():
                print(f"  {team}: {probability}")
    except Exception as e:
        print(f"Error during model training or prediction: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()