import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import personalities from "../personalities";

import dotenv from 'dotenv'; 
dotenv.config();

// Initialize the language model
const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

// Define the structured output schema for the transcript
const dialogueSchema = z.array(
  z.object({
    speaker: z.string().describe("The speaker, using 'Host 1' or 'Host 2' format"),
    text: z.string().describe("What the host says in this turn")
  })
).describe("The dialogue exchanges between hosts");

const transcriptSchema = z.object({
  dialogue: dialogueSchema
});

const structuredLlm = llm.withStructuredOutput(transcriptSchema, { name: "podcast" });

// Prompt template for generating the podcast dialogue
const podcastTemplate = PromptTemplate.fromTemplate(`
Generate a podcast transcript between two hosts discussing a specific topic.
The hosts should have personalities and perspectives based on the following people, but be referred to only as "Host 1" and "Host 2" in the output.

Host 1 personality: {personality1_name}
Host 1 description: {personality1_description}

Host 2 personality: {personality2_name}
Host 2 description: {personality2_description}

Topic: {topic}

Create a natural, engaging conversation where these two hosts discuss this topic from their unique perspectives. 
The conversation should include:
- Their individual thoughts on the topic
- Areas where they might agree or disagree based on their backgrounds
- Interesting insights that reflect their distinct personalities
- A conclusion with their final thoughts

IMPORTANT RULES:
1. The output MUST use "Host 1" and "Host 2" as speaker names, NOT the actual personality names.
2. The hosts should NEVER address each other directly. No "Hey there", "Hello", "Greetings", or any other direct acknowledgment.
3. NO phrases like "What do you think?", "As you mentioned", or other direct references to the other host.
4. Each host should simply state their own views and perspectives in response to what was previously said.
5. The conversation should flow naturally WITHOUT hosts acknowledging each other's presence directly.
6. Generate 8-12 dialogue exchanges that reflect each personality's unique viewpoint on the topic.
7. Start the conversation directly with substantive points about the topic, not with introductions or greetings.
`);

// Get a personality by UID
function getPersonalityByUid(uid: number) {
  const personality = personalities.find(p => p.uid === uid);
  if (!personality) {
    throw new Error(`Personality with UID ${uid} not found`);
  }
  return personality;
}

// Main function to create a podcast transcript
export async function createPodcastTranscript(
  personality1Uid: number,
  personality2Uid: number,
  topic: string
) {
  // Get the personalities
  const personality1 = getPersonalityByUid(personality1Uid);
  const personality2 = getPersonalityByUid(personality2Uid);
  
  // Generate the prompt
  const prompt = await podcastTemplate.format({
    personality1_name: personality1.name,
    personality1_description: personality1.personality,
    personality2_name: personality2.name,
    personality2_description: personality2.personality,
    topic: topic
  });
  
  // Generate the transcript
  const result = await structuredLlm.invoke(prompt);
  
  // Post-process dialogue to remove any direct acknowledgments
  const correctedDialogue = result.dialogue.map((entry, index) => {
    const isEvenIndex = index % 2 === 0;
    
    // Remove any direct addresses, greetings or acknowledgments
    let text = entry.text;
    
    // Remove direct addressing patterns
    text = text.replace(/Host 1[,\.!\?]?/gi, "");
    text = text.replace(/Host 2[,\.!\?]?/gi, "");
    text = text.replace(/Hey there[,\.!\?]?/gi, "");
    text = text.replace(/Hello[,\.!\?]?/gi, "");
    text = text.replace(/Hi[,\.!\?]?/gi, "");
    text = text.replace(/Greetings[,\.!\?]?/gi, "");
    text = text.replace(/Well said[,\.!\?]?/gi, "");
    text = text.replace(/I agree with you[,\.!\?]?/gi, "I agree");
    text = text.replace(/As you (mentioned|said|noted)[,\.!\?]?/gi, "");
    text = text.replace(/What (do you think|are your thoughts)[,\.!\?]?/gi, "");
    text = text.replace(/To your point[,\.!\?]?/gi, "");
    text = text.replace(/You're right[,\.!\?]?/gi, "");
    
    // Replace "you" with more general terms where possible
    text = text.replace(/what you are saying/gi, "that perspective");
    text = text.replace(/your perspective/gi, "that perspective");
    text = text.replace(/your view/gi, "that view");
    text = text.replace(/your point/gi, "that point");
    
    // Trim any potential extra spaces and ensure proper capitalization
    text = text.trim();
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    return {
      speaker: isEvenIndex ? "Host 1" : "Host 2",
      text: text
    };
  });
  
  // Create file content in the exact format required
  const transcriptContent = {
    dialogue: correctedDialogue
  };
  
  // In a real implementation, you would write this to the file:
  // fs.writeFileSync(path.join(__dirname, '../../transcript/podcast_transcript.json'), 
  //                  JSON.stringify(transcriptContent, null, 4));
  
  return transcriptContent;
} 