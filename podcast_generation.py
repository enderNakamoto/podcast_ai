import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API credentials from environment variables
PLAYDIALOG_SECRET_KEY = os.getenv("PLAYDIALOG_SECRET_KEY")
PLAYDIALOG_USER_ID = os.getenv("PLAYDIALOG_USER_ID")

# Check if credentials are available
if not PLAYDIALOG_SECRET_KEY or not PLAYDIALOG_USER_ID:
    raise ValueError("PLAYDIALOG_SECRET_KEY and PLAYDIALOG_USER_ID must be set in the .env file")

# Rest of your podcast generation logic here...

def main():
    # Your podcast generation code that uses the credentials
    print(f"Using credentials for user: {PLAYDIALOG_USER_ID}")
    
    # Example: Load transcript
    with open("transcript/podcast_transcript.json", "r") as f:
        transcript = json.load(f)
    
    # Process transcript using the API credentials
    # ...

if __name__ == "__main__":
    main() 