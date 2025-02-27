import fs from 'fs';
import path from 'path';
import { createPodcastTranscript } from './src/podcast/generateTranscript';
import dotenv from 'dotenv';
import readline from 'readline';

// Ensure environment variables are loaded
dotenv.config();

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get input from the user
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Parse command line arguments if provided
const args = process.argv.slice(2);
let personality1Uid: number | null = args[0] ? parseInt(args[0]) : null;
let personality2Uid: number | null = args[1] ? parseInt(args[1]) : null;
let topic: string | null = args[2] ? args[2] : null;

async function testPodcastGeneration() {
  try {
    // If arguments weren't provided via command line, ask for them interactively
    if (personality1Uid === null) {
      const input = await askQuestion("Enter UID for first personality (1-5): ");
      personality1Uid = parseInt(input);
    }
    
    if (personality2Uid === null) {
      const input = await askQuestion("Enter UID for second personality (1-5): ");
      personality2Uid = parseInt(input);
    }
    
    if (topic === null) {
      topic = await askQuestion("Enter topic for the podcast: ");
    }
    
    console.log(`\nGenerating podcast transcript between personalities ${personality1Uid} and ${personality2Uid} on topic: ${topic}`);
    
    // Generate the podcast transcript
    const transcript = await createPodcastTranscript(personality1Uid, personality2Uid, topic);
    
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
    
    rl.close();
    
  } catch (error) {
    console.error("Error generating transcript:", error);
    rl.close();
  }
}

// Run the test
testPodcastGeneration(); 