import requests
import os
import time
import json

# Set up headers with your API secret key and user ID
user_id = os.getenv("PLAYDIALOG_USER_ID")
secret_key = os.getenv("PLAYDIALOG_SECRET_KEY")
headers = {
    'X-USER-ID': user_id,
    'Authorization': secret_key,
    'Content-Type': 'application/json',
}

# define the model
model = 'PlayDialog'

# define voices for the 2 hosts
# find all voices here https://docs.play.ai/tts-api-reference/voices
voice_1 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'
voice_2 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'

# Read transcript from the fixed JSON file
def read_transcript_from_json():
    json_file_path = 'podcast_transcript.json'
    with open(json_file_path, 'r') as file:
        data = json.load(file)
        
        # Check if we have the new format with dialogue array
        if 'dialogue' in data:
            # Build transcript from dialogue array
            lines = []
            for item in data['dialogue']:
                speaker = item.get('speaker', '')
                text = item.get('text', '')
                lines.append(f"{speaker}: {text}")
            
            return "\n".join(lines)
        
        # Fall back to old format if needed
        return data.get('transcript', '')

# Generate podcast from transcript
def generate_podcast(transcript):
    payload = {
        'model': model,
        'text': transcript,
        'voice': voice_1,
        'voice2': voice_2,
        'turnPrefix': 'Host 1:',
        'turnPrefix2': 'Host 2:',
        'outputFormat': 'mp3',
    }
    
    # Send the POST request to trigger podcast generation
    response = requests.post('https://api.play.ai/api/v1/tts/', headers=headers, json=payload)
    
    # get the job id to check the status
    job_id = response.json().get('id')
    
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

# Main execution
if __name__ == "__main__":
    try:
        transcript = read_transcript_from_json()
        podcast_url = generate_podcast(transcript)
        print(f"\nPodcast generation complete!")
        print(f"Audio URL: {podcast_url}")
        
        # Automatically open in browser
        import webbrowser
        webbrowser.open(podcast_url)
            
    except FileNotFoundError:
        print("Error: podcast_transcript.json file not found.")
    except json.JSONDecodeError:
        print("Error: podcast_transcript.json is not a valid JSON file.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")