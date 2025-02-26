import fs from 'fs';
import path from 'path';
import { createPodcastTranscript } from './src/podcast/generateTranscript';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

async function testPodcastGeneration() {
  try {
    console.log("Generating podcast transcript...");
    
    // Select two personalities (Elon Musk and Einstein) and a topic
    const transcript = await createPodcastTranscript(1, 2, "The Future of Artificial Intelligence");
    
    // Ensure the transcript directory exists
    const transcriptDir = path.join(__dirname, 'transcript');
    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    
    // Write the output to podcast_transcript.json
    fs.writeFileSync(
      path.join(__dirname, 'transcript/podcast_transcript.json'), 
      JSON.stringify(transcript, null, 4)
    );
    
    console.log("Transcript successfully generated and saved to transcript/podcast_transcript.json");
    
    // Preview the first few exchanges
    console.log("\nPreview of generated transcript:");
    transcript.dialogue.slice(0, 3).forEach(entry => {
      console.log(`${entry.speaker}: ${entry.text.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error("Error generating transcript:", error);
  }
}

// Run the test
testPodcastGeneration(); 