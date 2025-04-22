import pandas as pd
import os

# Define the base directory where CSV files are stored
base_dir = "c:/sem6/cricket_predictor/data/match_data/"

# Define file paths
file_paths = {
    "match_results": os.path.join(base_dir, "match_results.csv"),
    "team_statistics": os.path.join(base_dir, "team_statistics.csv"),
    "toss_impact_by_venue": os.path.join(base_dir, "toss_impact_by_venue.csv"),
    "venue_categorized": os.path.join(base_dir, "venue_categorized.csv"),
    "venue_statistics": os.path.join(base_dir, "venue_statistics.csv"),
    "head_to_head_by_venue": os.path.join(base_dir, "head_to_head_by_venue.csv"),
    "head_to_head_results": os.path.join(base_dir, "head_to_head_results.csv"),
}

# Load all CSV files into a dictionary of DataFrames
dfs = {name: pd.read_csv(path) for name, path in file_paths.items()}

# Convert all column names to lowercase and strip spaces for consistency
for name, df in dfs.items():
    df.columns = df.columns.str.lower().str.strip()
    print(f"✅ Columns in {name}: {list(df.columns)}")  # Debugging Step

# 🔹 Check if 'teams' column exists in head_to_head_results
if "teams" in dfs["head_to_head_results"].columns:
    print("🔄 Splitting 'teams' column into 'team 1' and 'team 2'...")
    dfs["head_to_head_results"][["team 1", "team 2"]] = dfs["head_to_head_results"]["teams"].str.split(" vs ", expand=True)

    # Confirm that split was successful
    print(dfs["head_to_head_results"][["teams", "team 1", "team 2"]].head())
else:
    print("❌ Error: 'teams' column not found in head_to_head_results!")

# 🔹 Verify 'team 1' and 'team 2' exist before merging
if "team 1" not in dfs["head_to_head_results"].columns or "team 2" not in dfs["head_to_head_results"].columns:
    raise KeyError("❌ 'team 1' and 'team 2' are still missing after splitting 'teams'. Check the CSV format!")

# 🔹 Merge venue data
venue_data = dfs["venue_statistics"].merge(dfs["venue_categorized"], on="venue", how="left")

# 🔹 Merge toss impact data
match_data = dfs["match_results"].merge(dfs["toss_impact_by_venue"], on="venue", how="left")

# 🔹 Merge team statistics (Check if 'team' column exists)
if "team" in dfs["team_statistics"].columns:
    match_data = match_data.merge(dfs["team_statistics"], on="team", how="left")

# 🔹 Merge head-to-head data
if "team 1" in dfs["head_to_head_results"].columns and "team 2" in dfs["head_to_head_results"].columns:
    head_to_head_data = dfs["head_to_head_results"].merge(
        dfs["head_to_head_by_venue"], on=["team 1", "team 2"], how="left"
    )
else:
    print("❌ Error: 'team 1' and 'team 2' columns not found after splitting 'teams'!")

# 🔹 Merge all data together
final_data = match_data.merge(head_to_head_data, on=["team 1", "team 2"], how="left")

# Handle missing values
final_data.fillna(0, inplace=True)

# Save preprocessed data
final_data.to_csv(os.path.join(base_dir, "merged_cricket_data.csv"), index=False)

print("✅ Data preprocessing and merging complete! File saved as 'merged_cricket_data.csv'.")
