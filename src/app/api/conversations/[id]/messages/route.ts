import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { z } from 'zod';

const saveRequestSchema = z.object({
  isBranching: z.boolean(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      reasoning: z.string().default(''),
    })
  ),
  assistantMessage: z.object({
    role: z.literal('assistant'),
    content: z.string(),
    reasoning: z.string().default(''),
  }),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await context.params;
    const body = await req.json();
    const validation = saveRequestSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.format()), { status: 400 });
    }
    
    const { isBranching, history, assistantMessage } = validation.data;

    await connectToDB();
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    if (!conversation.branches) {
      conversation.branches = [];
    }

    const finalMessages = [...history, assistantMessage];

    if (isBranching) {
      conversation.branches.push({ messages: finalMessages });
      conversation.activeBranch = conversation.branches.length - 1;
    } else {
      if (!conversation.branches[conversation.activeBranch]) {
        conversation.branches[conversation.activeBranch] = { messages: [] };
      }
      // Overwrite the branch messages to ensure perfect sync
      conversation.branches[conversation.activeBranch].messages = finalMessages;
    }
    
    // Update title for new conversations
    if (finalMessages.length <= 2 && !isBranching && history.length > 0) {
      conversation.title = history[0].content.substring(0, 50);
    }

    console.log({conversation});

    await conversation.save();

    // Return the fully updated conversation document
    return NextResponse.json(conversation);

  } catch (error) {
    console.error('[SAVE_MESSAGES_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
