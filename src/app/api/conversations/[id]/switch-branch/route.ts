import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await context.params;
    const { branchIndex } = await req.json();

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (branchIndex < 0 || branchIndex >= conversation.branches.length) {
      return NextResponse.json({ error: "Invalid branch index" }, { status: 400 });
    }

    conversation.activeBranch = branchIndex;
    await conversation.save();

    // Return the updated conversation state
    return NextResponse.json(
      { 
        message: "Branch switched successfully",
        activeBranch: conversation.activeBranch,
        messages: conversation.branches[conversation.activeBranch].messages,
        totalBranches: conversation.branches.length,
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error switching branch:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}

