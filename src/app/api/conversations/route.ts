import connectToDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { NextResponse } from "next/server";

/**
 * @route GET /api/conversations
 * @desc Get all conversation titles and creation dates
 */
export async function GET() {
  try {
    await connectToDB();
    // Select only the fields needed for the conversation list to keep the payload small
    const conversations = await Conversation.find({})
      .sort({ createdAt: "desc" })
      .select("title createdAt");
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * @route POST /api/conversations
 * @desc Create a new conversation
 */
export async function POST() {
  try {
    await connectToDB();
    // A new conversation starts with one empty branch, which is set as the active branch.
    const newConversation = new Conversation({
      title: "New Chat",
      branches: [{ messages: [] }],
      activeBranch: 0,
    });
    await newConversation.save();
    // Return the full new conversation object so the frontend can switch to it
    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error("[CONVERSATIONS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

