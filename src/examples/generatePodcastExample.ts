import { createPodcastTranscript } from "../podcast/generateTranscript";
import fs from 'fs';
import path from 'path';

async function generateAndSavePodcast(personality1Uid: number, personality2Uid: number, topic: string) {
  try {
    console.log(`Generating podcast between personalities ${personality1Uid} and ${personality2Uid} on topic: ${topic}`);
    
    // Generate the podcast transcript
    const result = await createPodcastTranscript(personality1Uid, personality2Uid, topic);
    
    // Create a filename based on the personalities and topic
    const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${result.personalities[0].name.split(' ')[0]}_${result.personalities[1].name.split(' ')[0]}_${sanitizedTopic}.json`;
    
    // Ensure directory exists
    const outputDir = path.join(__dirname, '../../transcript');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the transcript to a file
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(result.transcript, null, 2));
    
    console.log(`Podcast transcript saved to: ${outputPath}`);
    
    // Preview the conversation
    console.log('\nPreview of the podcast:');
    result.transcript.dialogue.slice(0, 3).forEach(exchange => {
      console.log(`${exchange.speaker}: ${exchange.text.substring(0, 100)}${exchange.text.length > 100 ? '...' : ''}`);
    });
    console.log('...');
    
    return result;
    
  } catch (error) {
    console.error("Error generating podcast:", error);
    throw error;
  }
}

// Example usage
// generateAndSavePodcast(1, 2, "The Future of Space Exploration");

export { generateAndSavePodcast }; 