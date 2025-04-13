import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

if (!vectorStoreId) {
  console.error('❌ Missing OPENAI_VECTOR_STORE_ID in environment variables.');
  process.exit(1);
}

async function checkFiles() {
  try {
    const files = await openai.vectorStores.files.list(vectorStoreId!); // <- FIXED

    if (!files.data.length) {
      console.log('⚠️ No files found in the vector store.');
      return;
    }

    console.log(`📦 Vector store contains ${files.data.length} file(s):`);

    for (const file of files.data) {
      const fileInfo = await openai.files.retrieve(file.id);
      console.log(
        `- File: ${fileInfo.filename} (${fileInfo.id}) – Status: ${
          fileInfo.status
        } – Created: ${new Date(fileInfo.created_at * 1000).toLocaleString()}`
      );
    }
  } catch (err) {
    console.error('❌ Error checking files:', err);
  }
}

checkFiles();
