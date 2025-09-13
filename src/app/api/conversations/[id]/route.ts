import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

// GET a specific conversation's active branch messages
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }
    await connectToDB();
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    // Ensure branches exist and activeBranch is valid
    if (!conversation.branches || conversation.branches.length === 0 || !conversation.branches[conversation.activeBranch]) {
       // This case can happen if a conversation is corrupted. Let's return a clean state.
       return NextResponse.json({
         messages: [],
         activeBranch: 0,
         totalBranches: conversation.branches?.length || 1,
       }, { status: 200 });
    }

    const activeBranchMessages = conversation.branches[conversation.activeBranch].messages;
    const totalBranches = conversation.branches.length;

    return NextResponse.json({
        messages: activeBranchMessages,
        activeBranch: conversation.activeBranch,
        totalBranches: totalBranches,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// DELETE a conversation
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await context.params;
    const deletedConversation = await Conversation.findByIdAndDelete(id);
    if (!deletedConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Conversation deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

