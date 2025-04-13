import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkAssistantDetails() {
  const assistant = await openai.beta.assistants.retrieve(
    process.env.OPENAI_ASSISTANT_ID!
  );

  console.log('🧠 Assistant details:');
  console.log('Name:', assistant.name);
  console.log('Model:', assistant.model);
  console.log('Instructions:', assistant.instructions);
  console.log('Tools:', assistant.tools);
  console.log('Tool Resources:', assistant.tool_resources);
}

checkAssistantDetails().catch(console.error);
