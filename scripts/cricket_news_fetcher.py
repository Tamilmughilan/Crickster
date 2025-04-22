import requests
import json
import os
from datetime import datetime

RAPIDAPI_KEY = "0f7f60711fmsha1bf1d3b764bcc1p1e8290jsn4980aa31ec3a"
BASE_URL = "https://cricbuzz-cricket.p.rapidapi.com/"

HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com"
}

# Path to save the output files
PUBLIC_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")

def get_cricket_news():
    """Fetches cricket news from Cricbuzz API."""
    url = f"{BASE_URL}news/v1/index"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching cricket news: {response.status_code}\nResponse: {response.text}")
        return {"storyList": []}

def main():
    print("Fetching cricket news...")
    news_data = get_cricket_news()
    
    # Ensure the public directory exists
    os.makedirs(PUBLIC_PATH, exist_ok=True)
    
    # Save cricket news data
    news_file_path = os.path.join(PUBLIC_PATH, "cricket_news.json")
    with open(news_file_path, "w") as f:
        json.dump(news_data, f, indent=4)
    
    print(f"Cricket news saved to {news_file_path}")
    
    # Update the timestamp file
    timestamp_path = os.path.join(PUBLIC_PATH, "news_last_updated.txt")
    with open(timestamp_path, "w") as f:
        f.write(datetime.now().isoformat())
    
    print(f"Updated timestamp file at {timestamp_path}")

if __name__ == "__main__":
    main()