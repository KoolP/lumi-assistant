// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message, threadId } = await req.json();

    // 1. Create a new thread if none exists
    const thread = threadId
      ? { id: threadId }
      : await openai.beta.threads.create();

    // 2. Add the user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });

    // 3. Create a run (Assistant will respond)
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // 4. Poll until the run completes or fails
    let status = run.status;
    let completedRun = run;

    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('[DEBUG] Completed run object:', completedRun);
      status = completedRun.status;
    }

    // 5. Get and log run steps (for debugging tool usage)
    const steps = await openai.beta.threads.runs.steps.list(thread.id, run.id);
    console.log('[DEBUG] Run steps:', steps.data);

    // 6. Get assistant message
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(m => m.role === 'assistant');

    if (!assistantMessage) {
      console.warn('[WARN] No assistant message found:', messages.data);
      return NextResponse.json({
        reply: 'No assistant reply found.',
        threadId: thread.id,
      });
    }

    const textBlocks = assistantMessage.content?.filter(
      c => c.type === 'text'
    ) as Array<{ type: 'text'; text: { value: string } }>;

    const replyText =
      textBlocks
        ?.map(block => block.text.value)
        .join('\n\n')
        .trim() || null;

    console.log('[DEBUG] Assistant content:', assistantMessage.content);
    console.log('[DEBUG] Extracted reply text:', replyText);
    console.log('[DEBUG] All thread messages:', messages.data);
    console.log('[DEBUG] Number of text blocks:', textBlocks.length);

    const cleanedReply =
      replyText
        ?.replace(/\r\n/g, '\n') // normalize Windows line breaks
        .trim() ?? 'No textual response.';

    console.log('[DEBUG] Cleaned reply text:', cleanedReply);

    console.log('[DEBUG] Cleaned reply text:', cleanedReply);

    return NextResponse.json({
      reply: cleanedReply ?? 'No textual response.',
      threadId: thread.id,
    });
  } catch (err) {
    console.error('Error in POST /api/chat:', err);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
