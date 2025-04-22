# visualizations.py
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
from sklearn.inspection import permutation_importance
import os

def plot_feature_importance(model, feature_names, top_n=15, save_path=None):
    """
    Plot feature importance from the Random Forest model.
    
    Parameters:
    -----------
    model : sklearn Pipeline
        Trained model pipeline with RandomForestClassifier
    feature_names : list
        Names of features after preprocessing
    top_n : int, default=15
        Number of top features to display
    save_path : str, optional
        Path to save the figure
    
    Returns:
    --------
    matplotlib.figure.Figure
        The feature importance plot
    """
    plt.figure(figsize=(12, 8))
    
    # Extract feature importances from the model
    if hasattr(model['classifier'], 'feature_importances_'):
        importances = model['classifier'].feature_importances_
        
        # Handle case where feature_names and importances have different lengths
        if len(feature_names) != len(importances):
            print(f"Warning: Feature names length ({len(feature_names)}) doesn't match importances length ({len(importances)})")
            
            # Try to extract feature names from the pipeline if possible
            if hasattr(model, 'get_feature_names_out'):
                try:
                    # For newer scikit-learn versions
                    feature_names = model.get_feature_names_out()
                except:
                    try:
                        # For older scikit-learn versions or custom pipelines
                        feature_names = model.named_steps['preprocessor'].get_feature_names_out()
                    except:
                        print("Could not extract feature names from pipeline, using generic names")
                        # Create generic feature names based on importances length
                        feature_names = [f'Feature_{i}' for i in range(len(importances))]
            else:
                # If we still have a mismatch, truncate or pad the feature_names list
                if len(feature_names) > len(importances):
                    print("Truncating feature names to match importances length")
                    feature_names = feature_names[:len(importances)]
                else:
                    print("Padding feature names with generic names")
                    additional_names = [f'Feature_{i+len(feature_names)}' for i in range(len(importances) - len(feature_names))]
                    feature_names = feature_names + additional_names
        
        # Create DataFrame for plotting
        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importances
        }).sort_values(by='Importance', ascending=False).head(top_n)
        
        # Plot horizontal bar chart
        ax = sns.barplot(x='Importance', y='Feature', data=importance_df, palette='viridis')
        
        # Add value labels
        for i, v in enumerate(importance_df['Importance']):
            ax.text(v + 0.005, i, f'{v:.3f}', va='center')
        
        plt.title('Top Feature Importance in Cricket Match Prediction', fontsize=16)
        plt.xlabel('Relative Importance', fontsize=12)
        plt.ylabel('Feature', fontsize=12)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Feature importance plot saved to {save_path}")
            
        return plt.gcf()
    else:
        print("Model doesn't have feature_importances_ attribute")
        return None


def plot_win_predictions(test_data, min_threshold=0.6, save_path=None):
    """
    Visualize win predictions for upcoming matches.
    
    Parameters:
    -----------
    test_data : pandas.DataFrame
        DataFrame containing match predictions
    min_threshold : float, default=0.6
        Minimum probability threshold to consider a prediction certain
    save_path : str, optional
        Path to save the figure
    
    Returns:
    --------
    matplotlib.figure.Figure
        The win predictions plot
    """
    plt.figure(figsize=(12, 8))
    
    # Check if test_data has the required columns
    required_columns = ['team_1', 'team_2', 'venue', 'team_1_win_probability', 'team_2_win_probability']
    missing_columns = [col for col in required_columns if col not in test_data.columns]
    
    if missing_columns:
        print(f"Warning: Test data is missing required columns: {missing_columns}")
        return None
    
    # Create a DataFrame with both teams and their probabilities
    plot_data = []
    
    for _, match in test_data.iterrows():
        team1 = match['team_1']
        team2 = match['team_2']
        
        # Check if probability columns exist, otherwise calculate them
        if 'team_1_win_probability' in match:
            team1_prob = match['team_1_win_probability']
            team2_prob = match['team_2_win_probability']
        else:
            print("Warning: Probability columns not found, setting to default 0.5")
            team1_prob = 0.5
            team2_prob = 0.5
        
        # Create venue label, handling potential missing venue data
        venue = match.get('venue', 'Unknown Venue')
        
        match_label = f"{team1} vs {team2}\n({venue})"
        
        plot_data.append({
            'Match': match_label,
            'Team': team1,
            'Win Probability': team1_prob,
            'Predicted Winner': team1_prob > team2_prob
        })
        
        plot_data.append({
            'Match': match_label,
            'Team': team2,
            'Win Probability': team2_prob,
            'Predicted Winner': team2_prob > team1_prob
        })
    
    plot_df = pd.DataFrame(plot_data)
    
    # Sort by match to ensure teams from the same match are adjacent
    plot_df = plot_df.sort_values(['Match', 'Win Probability'], ascending=[True, False])
    
    # Create a custom palette based on whether team is predicted winner
    colors = ['#2ecc71' if winner else '#3498db' for winner in plot_df['Predicted Winner']]
    
    # Plot horizontal bar chart
    ax = sns.barplot(
        x='Win Probability', 
        y='Match', 
        hue='Team',
        data=plot_df,
        palette=colors,
        dodge=True
    )
    
    # Add confidence threshold line
    plt.axvline(x=min_threshold, color='red', linestyle='--', alpha=0.7, 
                label=f'Confidence Threshold ({min_threshold})')
    
    # Add value labels to the bars
    for i, bar in enumerate(ax.patches):
        width = bar.get_width()
        ax.text(
            width + 0.01,
            bar.get_y() + bar.get_height()/2,
            f'{width:.2f}',
            ha='left',
            va='center'
        )
    
    plt.title('Win Probability Predictions for Upcoming Matches', fontsize=16)
    plt.xlabel('Win Probability', fontsize=12)
    plt.ylabel('Match', fontsize=12)
    plt.xlim(0, 1.1)
    plt.legend(title='Team', loc='upper right')
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Win predictions plot saved to {save_path}")
        
    return plt.gcf()


def plot_team_performance_comparison(train_data, test_data, save_path=None):
    """
    Compare team performance metrics between teams in upcoming matches.
    
    Parameters:
    -----------
    train_data : pandas.DataFrame
        DataFrame containing training data with team performance metrics
    test_data : pandas.DataFrame
        DataFrame containing test data with upcoming matches
    save_path : str, optional
        Path to save the figure
    
    Returns:
    --------
    matplotlib.figure.Figure
        The team performance comparison plot
    """
    # Check if test_data and train_data have required columns
    if 'team_1' not in test_data.columns or 'team_2' not in test_data.columns:
        print("Warning: Test data is missing team columns")
        return None
    
    if 'team_1' not in train_data.columns or 'team_2' not in train_data.columns or 'winner' not in train_data.columns:
        print("Warning: Training data is missing required columns")
        return None
    
    plt.figure(figsize=(15, 10))
    
    # Extract unique teams from test data
    teams = set()
    for _, match in test_data.iterrows():
        teams.add(match['team_1'])
        teams.add(match['team_2'])
    
    teams = list(teams)
    
    # Define key performance metrics to compare
    metrics = [
        'batting_average_odi',
        'batting_strike_rate_odi',
        'bowling_average_odi',
        'bowling_strike_rate_odi',
        'economy_odi',
        'win_percentage'
    ]
    
    # Check which metrics are available in the data
    available_metrics = [metric for metric in metrics[:-1] if 
                        any(metric in col for col in train_data.columns) or 
                        any(metric in col for col in test_data.columns)]
    available_metrics.append('win_percentage')  # Always calculate win percentage
    
    if not available_metrics:
        print("Warning: No matching metrics found in the data")
        return None
    
    # Extract metrics for each team
    team_metrics = {}
    for team in teams:
        team_metrics[team] = {}
        
        # Calculate win percentage
        team_matches = train_data[(train_data['team_1'] == team) | (train_data['team_2'] == team)]
        team_wins_condition1 = (train_data['team_1'] == team) & (train_data['winner'] == team)
        team_wins_condition2 = (train_data['team_2'] == team) & (train_data['winner'] == team)
        team_wins = len(train_data[team_wins_condition1 | team_wins_condition2])
        
        win_percentage = team_wins / len(team_matches) * 100 if len(team_matches) > 0 else 50
        team_metrics[team]['win_percentage'] = win_percentage
        
        # Extract other metrics
        for metric in available_metrics[:-1]:  # Exclude win_percentage as we calculated it above
            # Look for columns matching the metric pattern for both team positions
            cols = [col for col in train_data.columns if metric in col]
            
            for col in cols:
                if '_team_1' in col:
                    team1_data = train_data[train_data['team_1'] == team][col].dropna()
                    if not team1_data.empty:
                        if metric not in team_metrics[team]:
                            team_metrics[team][metric] = []
                        team_metrics[team][metric].extend(team1_data.tolist())
                
                if '_team_2' in col:
                    team2_data = train_data[train_data['team_2'] == team][col].dropna()
                    if not team2_data.empty:
                        if metric not in team_metrics[team]:
                            team_metrics[team][metric] = []
                        team_metrics[team][metric].extend(team2_data.tolist())
            
            # Calculate average if we have data
            if metric in team_metrics[team] and team_metrics[team][metric]:
                team_metrics[team][metric] = np.mean(team_metrics[team][metric])
            else:
                # Use test data if available
                test_cols = [col for col in test_data.columns if metric in col]
                for col in test_cols:
                    if '_team_1' in col and team in test_data['team_1'].values:
                        test_team1_data = test_data[test_data['team_1'] == team][col]
                        if not test_team1_data.empty:
                            team_metrics[team][metric] = test_team1_data.iloc[0]
                            break
                    elif '_team_2' in col and team in test_data['team_2'].values:
                        test_team2_data = test_data[test_data['team_2'] == team][col]
                        if not test_team2_data.empty:
                            team_metrics[team][metric] = test_team2_data.iloc[0]
                            break
                else:
                    team_metrics[team][metric] = 0  # Default if no data available
    
    # Check if we have valid test data
    if not test_data.empty:
        # Create radar chart for each upcoming match
        match_count = len(test_data)
        rows = int(np.ceil(match_count / 2))
        cols = min(2, match_count)
        
        fig, axes = plt.subplots(rows, cols, figsize=(15, 5 * rows), subplot_kw=dict(polar=True))
        
        # Handle the case of a single subplot
        if match_count == 1:
            axes = np.array([axes])  # Convert to array for consistent indexing
        elif rows == 1:
            axes = axes.reshape(1, -1)  # Ensure 2D array for consistent indexing
        
        for i, (_, match) in enumerate(test_data.iterrows()):
            team1 = match['team_1']
            team2 = match['team_2']
            
            # Handle different subplot layout cases
            if match_count == 1:
                ax = axes[0]
            elif match_count <= 2:
                ax = axes[i]
            else:
                ax = axes[i // cols, i % cols]
            
            # Set up radar chart
            metrics_display = [
                'Batting Avg', 
                'Batting SR', 
                'Bowling Avg', 
                'Bowling SR', 
                'Economy', 
                'Win %'
            ]
            
            # Filter metrics that we have data for
            available_metrics_display = []
            available_metrics_data = []
            
            for m, m_display in zip(metrics, metrics_display):
                if m in team_metrics[team1] and m in team_metrics[team2]:
                    available_metrics_display.append(m_display)
                    available_metrics_data.append(m)
            
            if not available_metrics_data:
                ax.text(0, 0, "Not enough data\nfor visualization", 
                        ha='center', va='center', fontsize=12)
                ax.axis('off')
                continue
            
            # Number of metrics
            N = len(available_metrics_data)
            
            # Create angle for each metric
            angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist()
            angles += angles[:1]  # Close the polygon
            
            # Extract metric values for both teams
            team1_values = []
            team2_values = []
            
            for metric in available_metrics_data:
                # Normalize metrics (lower is better for bowling stats)
                val1 = team_metrics[team1].get(metric, 0)
                val2 = team_metrics[team2].get(metric, 0)
                
                if 'bowling' in metric or 'economy' in metric:
                    # Invert bowling stats for visualization (lower is better)
                    max_val = max(val1, val2) * 1.2
                    if max_val == 0:
                        max_val = 1  # Avoid division by zero
                    team1_values.append((max_val - val1) / max_val)
                    team2_values.append((max_val - val2) / max_val)
                else:
                    # Normalize batting stats and win percentage (higher is better)
                    max_val = max(val1, val2) * 1.2
                    if max_val == 0:
                        max_val = 1  # Avoid division by zero
                    team1_values.append(val1 / max_val)
                    team2_values.append(val2 / max_val)
            
            # Close the polygon
            team1_values += team1_values[:1]
            team2_values += team2_values[:1]
            
            # Adjust angles list to match the data length
            plot_angles = angles[:len(team1_values)]
            
            # Plot both teams
            ax.plot(plot_angles, team1_values, 'o-', linewidth=2, label=team1)
            ax.fill(plot_angles, team1_values, alpha=0.25)
            ax.plot(plot_angles, team2_values, 'o-', linewidth=2, label=team2)
            ax.fill(plot_angles, team2_values, alpha=0.25)
            
            # Set labels
            ax.set_xticks(plot_angles[:-1])
            ax.set_xticklabels(available_metrics_display)
            
            # Set title
            venue = match.get('venue', 'Unknown Venue')
            city = match.get('city', '')
            location = f"{venue}, {city}" if city else venue
            
            ax.set_title(f"{team1} vs {team2}\n{location}")
            ax.legend(loc='upper right', bbox_to_anchor=(0.1, 0.1))
        
        # Handle empty subplots if odd number of matches
        if match_count > 1 and match_count % 2 == 1:
            if rows > 1:
                fig.delaxes(axes[rows-1, cols-1])
            else:
                fig.delaxes(axes[0, cols-1])
        
        plt.tight_layout()
        plt.suptitle('Team Performance Comparison for Upcoming Matches', fontsize=20, y=1.05)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Team performance comparison plot saved to {save_path}")
            
        return fig
    else:
        print("Warning: Empty test data, cannot create team performance comparison")
        return None


def create_visualizations(model, feature_names, train_data, test_data, output_dir="../public/visualizations"):
    """
    Create and save all visualizations for the cricket match prediction model.
    
    Parameters:
    -----------
    model : sklearn Pipeline
        Trained model pipeline with RandomForestClassifier
    feature_names : list
        Names of features after preprocessing
    train_data : pandas.DataFrame
        DataFrame containing training data
    test_data : pandas.DataFrame
        DataFrame containing test data with predictions
    output_dir : str, default="visualizations"
        Directory to save visualizations
    
    Returns:
    --------
    None
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
    
    try:
        # 1. Feature Importance Visualization
        feature_importance_path = os.path.join(output_dir, "feature_importance.png")
        plot_feature_importance(model, feature_names, save_path=feature_importance_path)
    except Exception as e:
        print(f"Error creating feature importance visualization: {e}")
    
    try:
        # 2. Win Predictions Visualization
        win_predictions_path = os.path.join(output_dir, "win_predictions.png")
        plot_win_predictions(test_data, save_path=win_predictions_path)
    except Exception as e:
        print(f"Error creating win predictions visualization: {e}")
    
    try:
        # 3. Team Performance Comparison
        team_comparison_path = os.path.join(output_dir, "team_performance_comparison.png")
        plot_team_performance_comparison(train_data, test_data, save_path=team_comparison_path)
    except Exception as e:
        print(f"Error creating team performance comparison visualization: {e}")
    
    print(f"Visualizations have been saved to the '{output_dir}' directory")


# Example usage in main.py:
"""
# After training the model and making predictions
create_visualizations(model, feature_cols, cleaned_train_data, prepared_test_data)
"""