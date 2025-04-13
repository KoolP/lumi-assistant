import { config } from 'dotenv';
config({ path: '.env.local' });

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID!;

async function linkVectorStore() {
  const updated = await openai.beta.assistants.update(ASSISTANT_ID, {
    tools: [{ type: 'file_search' }],
    tool_resources: {
      file_search: {
        vector_store_ids: [VECTOR_STORE_ID],
      },
    },
  });

  console.log('Assistant linked to vector store:', updated.id);
}

linkVectorStore().catch(console.error);
