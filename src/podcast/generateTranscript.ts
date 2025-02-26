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
- Their initial thoughts on the topic
- Areas where they might agree or disagree based on their backgrounds
- Interesting insights that reflect their distinct personalities
- A conclusion with their final thoughts

Generate 8-12 dialogue exchanges that sound natural and authentic to each personality.

IMPORTANT: The output MUST use "Host 1" and "Host 2" as speaker names, NOT the actual personality names.
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
  
  // Ensure all speakers are correctly labeled as "Host 1" or "Host 2"
  const correctedDialogue = result.dialogue.map((entry, index) => {
    const isEvenIndex = index % 2 === 0;
    return {
      speaker: isEvenIndex ? "Host 1" : "Host 2",
      text: entry.text
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