import { NextRequest  } from "next/server";
import connectToDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import ApiKey from "@/models/ApiKey";
import { z } from "zod";
import { Role } from "@/types";

// Updated schema to include an optional index for branching
const chatRequestSchema = z.object({
  conversationId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  systemPrompt: z.string(),
  branchFromIndex: z.number().optional(), // If present, a new branch is created
});

const MAX_MESSAGES_TO_SEND = 60; // Adjust this number as needed
export async function POST(req: NextRequest) {
  /* const ip = req.ip ?? "127.0.0.1";
  const { success: rateLimitSuccess } = await ratelimit.limit(ip);
  if (!rateLimitSuccess) {
    return new Response("You are sending messages too fast.", { status: 429 });
  }
 */
  try {
    const body = await req.json();
    const validation = chatRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.format()), { status: 400 });
    }

    const { conversationId, messages, systemPrompt, branchFromIndex } = validation.data;
    const isBranching = typeof branchFromIndex === 'number';
    
    await connectToDB();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }
    
    // --- API Key Rotation Logic ---
    const availableKeys = await ApiKey.find({
        $or: [
            { rateLimitedUntil: { $exists: false } },
            { rateLimitedUntil: { $lt: new Date() } }
        ]
    }).sort({ lastUsed: 1 });

    if (availableKeys.length === 0) {
        return new Response("All API keys are currently rate-limited.", { status: 429 });
    }

    let openRouterResponse;
    let successfulKey;

    const userMessage = messages[messages.length - 1];
    const messagesForApi = [{ role: "system", content: systemPrompt }, ...messages.slice(-MAX_MESSAGES_TO_SEND)];

    for (const key of availableKeys) {
        const openRouterPayload = {
          model: "deepseek/deepseek-chat-v3.1:free",
          messages: messagesForApi,
          stream: true,
          reasoning: {
            enabled: true,
            effort: "high"
          }
        };

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key.key}`,
                },
                body: JSON.stringify(openRouterPayload),
            }
        );

        if (response.status === 429) {
            key.rateLimitedUntil = new Date(Date.now() + 5 * 60 * 1000); 
            await key.save();
            continue;
        }

        if (response.ok) {
            openRouterResponse = response;
            successfulKey = key;
            break;
        } else {
             console.error(`API Key ${String(key._id).slice(-4)} failed with status ${response.status}`);
        }
    }

    if (!openRouterResponse || !successfulKey) {
        return new Response("All available API keys failed or are rate-limited.", { status: 500 });
    }
    
    successfulKey.lastUsed = new Date();
    await successfulKey.save();
    
    const stream = new ReadableStream({
      async start(controller) {
        if (!openRouterResponse?.body) {
          controller.close();
          return;
        }
        const reader = openRouterResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));
          for (const line of lines) {
            const jsonStr = line.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                controller.enqueue(content);
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
        
        const finalAssistantMessage = { role: "assistant" as Role, content: fullResponse };
        
        // **FIX**: Ensure branches array exists.
        if (!conversation.branches) {
            conversation.branches = [];
        }

        if (isBranching) {
            const newBranchMessages = [...messages, finalAssistantMessage];
            conversation.branches.push({ messages: newBranchMessages });
            conversation.activeBranch = conversation.branches.length - 1;
        } else {
            // Ensure the active branch exists before trying to push to it.
            if (!conversation.branches[conversation.activeBranch]) {
                conversation.branches[conversation.activeBranch] = { messages: [] };
            }
            const activeBranch = conversation.branches[conversation.activeBranch];
            activeBranch.messages.push(userMessage, finalAssistantMessage);
        }

        if (conversation.branches[conversation.activeBranch] && conversation.branches[conversation.activeBranch].messages.length <= 2 && !isBranching) {
          conversation.title = messages[0].content.substring(0, 50);
        }
        console.log({conversation});
        
        await conversation.save();
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("[CHAT_API_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

