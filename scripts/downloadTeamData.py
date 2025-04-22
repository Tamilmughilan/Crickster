import os
import requests
import zipfile
import json
import time
from datetime import datetime, timedelta
import shutil

def download_cricsheet_data():
    """
    Downloads data from Cricsheet for international matches and IPL
    Stores the data in the public/teamData folder
    """
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Navigate to the public/teamData directory
    output_dir = os.path.join(script_dir, '..', 'public', 'teamData')
    output_dir = os.path.abspath(output_dir)
    
    # Create directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # URLs for different formats
    urls = {
        "t20": "https://cricsheet.org/downloads/t20s_json.zip",
        "odi": "https://cricsheet.org/downloads/odis_json.zip",
        "test": "https://cricsheet.org/downloads/tests_json.zip",
        "ipl": "https://cricsheet.org/downloads/ipl_json.zip"
    }
    
    # Download and extract each format
    for format_name, url in urls.items():
        print(f"Downloading {format_name} data...")
        
        # Create format-specific directory
        format_dir = os.path.join(output_dir, format_name)
        os.makedirs(format_dir, exist_ok=True)
        
        # Download the zip file
        zip_path = os.path.join(output_dir, f"{format_name}.zip")
        response = requests.get(url, stream=True)
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Extract the zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(format_dir)
        
        # Remove the zip file
        os.remove(zip_path)
        
        # Filter matches from the last 30 days
        filter_recent_matches(format_dir, 30)
        
        print(f"Downloaded and processed {format_name} data")
    
    # Create a timestamp file to track when data was last updated
    with open(os.path.join(output_dir, 'last_updated.txt'), 'w') as f:
        f.write(datetime.now().isoformat())
    
    print("All cricket data downloaded successfully!")

def filter_recent_matches(directory, days=30):
    """
    Filters matches to keep only those from the last specified days
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Create a temporary directory for filtered files
    temp_dir = os.path.join(directory, 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    
    # Get all JSON files
    json_files = [f for f in os.listdir(directory) if f.endswith('.json') and os.path.isfile(os.path.join(directory, f))]
    
    for file_name in json_files:
        file_path = os.path.join(directory, file_name)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Check if the match was played in the last 30 days
            match_date_str = data.get('info', {}).get('dates', [None])[0]
            if match_date_str:
                match_date = datetime.strptime(match_date_str, '%Y-%m-%d')
                if match_date >= cutoff_date:
                    # Keep this file
                    shutil.copy(file_path, os.path.join(temp_dir, file_name))
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error processing {file_name}: {str(e)}")
    
    # Remove all JSON files from the original directory
    for file_name in json_files:
        file_path = os.path.join(directory, file_name)
        os.remove(file_path)
    
    # Move filtered files back to the original directory
    for file_name in os.listdir(temp_dir):
        shutil.move(os.path.join(temp_dir, file_name), os.path.join(directory, file_name))
    
    # Remove the temporary directory
    os.rmdir(temp_dir)

def should_update_data():
    """
    Checks if the data should be updated (every 30 days)
    """
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the timestamp file
    timestamp_file = os.path.join(script_dir, '..', 'public', 'teamData', 'last_updated.txt')
    timestamp_file = os.path.abspath(timestamp_file)
    
    if not os.path.exists(timestamp_file):
        return True
    
    with open(timestamp_file, 'r') as f:
        last_updated = datetime.fromisoformat(f.read().strip())
    
    days_since_update = (datetime.now() - last_updated).days
    return days_since_update >= 30

if __name__ == "__main__":
    if should_update_data():
        download_cricsheet_data()
        print("Cricket data updated successfully!")
    else:
        print("Cricket data is up to date. Skipping download.")