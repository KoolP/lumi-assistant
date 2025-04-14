import OpenAI from 'openai';
import { type NextRequest } from 'next/server';

export const runtime = 'edge'; // Enables streaming on Vercel or other edge environments

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { message, threadId } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Create a thread if none exists
        const thread = threadId
          ? { id: threadId }
          : await openai.beta.threads.create();

        // 2. Add user message to the thread
        await openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: message,
        });

        // 3. Create and stream the assistant run
        const runStream = await openai.beta.threads.runs.stream(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID!,
        });

        // 4. Process the streamed events
        for await (const event of runStream) {
          if (
            event.event === 'thread.message.delta' &&
            Array.isArray(event.data?.delta?.content)
          ) {
            for (const block of event.data.delta.content) {
              if (
                block.type === 'text' &&
                'text' in block &&
                typeof block.text?.value === 'string'
              ) {
                controller.enqueue(encoder.encode(block.text.value));
              }
            }
          }

          if (event.event === 'thread.run.completed') {
            controller.close();
          }
        }
      } catch (error) {
        console.error('[Streaming Error]', error);
        controller.enqueue(
          encoder.encode('⚠️ Assistant failed to respond. Please try again.\n')
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
