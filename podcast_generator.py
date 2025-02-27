import requests
import os
import time
import json
import webbrowser
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API credentials from environment variables
PLAYDIALOG_SECRET_KEY = os.getenv("PLAYDIALOG_SECRET_KEY")
PLAYDIALOG_USER_ID = os.getenv("PLAYDIALOG_USER_ID")

# Check if credentials are available
if not PLAYDIALOG_SECRET_KEY or not PLAYDIALOG_USER_ID:
    raise ValueError("PLAYDIALOG_SECRET_KEY and PLAYDIALOG_USER_ID must be set in the .env file")

# Changed file path to look in transcript/ directory
TRANSCRIPT_PATH = "transcript/podcast_transcript.json"

# Set up headers with your API secret key and user ID
headers = {
    'X-USER-ID': PLAYDIALOG_USER_ID,
    'Authorization': PLAYDIALOG_SECRET_KEY,
    'Content-Type': 'application/json',
}

# define the model
model = 'PlayDialog'

# define voices for the 2 hosts
# find all voices here https://docs.play.ai/tts-api-reference/voices
voice_1 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'
voice_2 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'

def load_transcript():
    """Load the podcast transcript from the transcript directory"""
    try:
        with open(TRANSCRIPT_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Transcript file not found at {TRANSCRIPT_PATH}")
        print("Make sure to run the transcript generator first.")
        exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in transcript file {TRANSCRIPT_PATH}")
        exit(1)

def format_transcript_for_api(transcript_data):
    """Format the transcript data into the text format expected by the API"""
    lines = []
    for item in transcript_data['dialogue']:
        speaker = item.get('speaker', '')
        text = item.get('text', '')
        lines.append(f"{speaker}: {text}")
    
    return "\n".join(lines)

# Generate podcast from transcript
def generate_podcast(transcript_text):
    payload = {
        'model': model,
        'text': transcript_text,
        'voice': voice_1,
        'voice2': voice_2,
        'turnPrefix': 'Host 1:',
        'turnPrefix2': 'Host 2:',
        'outputFormat': 'mp3',
    }
    
    # Send the POST request to trigger podcast generation
    response = requests.post('https://api.play.ai/api/v1/tts/', headers=headers, json=payload)
    
    if not response.ok:
        print(f"Error: API request failed with status {response.status_code}")
        print(response.text)
        exit(1)
    
    # get the job id to check the status
    job_id = response.json().get('id')
    print(f"Job ID: {job_id}")
    
    # use the job id to check completion status
    url = f'https://api.play.ai/api/v1/tts/{job_id}'
    delay_seconds = 2
    
    # keep checking until status is COMPLETED.
    # longer transcripts take more time to complete.
    print("Generating podcast...")
    while True:
        response = requests.get(url, headers=headers)
        if response.ok:
            status = response.json().get('output', {}).get('status')
            print(f"Status: {status}")
            if status == 'COMPLETED':
                # once completed audio url will be available
                podcast_audio = response.json().get('output', {}).get('url')
                return podcast_audio
        time.sleep(delay_seconds)

def main():
    print(f"Using credentials for user: {PLAYDIALOG_USER_ID}")
    
    # Load transcript from the transcript directory
    transcript_data = load_transcript()
    print(f"Loaded transcript with {len(transcript_data['dialogue'])} dialogue exchanges")
    
    # Format the transcript for the API
    transcript_text = format_transcript_for_api(transcript_data)
    
    # Preview the first exchange
    if transcript_data and 'dialogue' in transcript_data and len(transcript_data['dialogue']) > 0:
        first_exchange = transcript_data['dialogue'][0]
        print(f"First line: {first_exchange['speaker']}: {first_exchange['text'][:50]}...")
    
    # Generate the podcast
    print("\nGenerating podcast audio...")
    podcast_url = generate_podcast(transcript_text)
    
    print(f"\nPodcast generation complete!")
    print(f"Audio URL: {podcast_url}")
    
    # Automatically open in browser
    print("Opening podcast in browser...")
    webbrowser.open(podcast_url)
    
    return podcast_url

# Main execution
if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {str(e)}")