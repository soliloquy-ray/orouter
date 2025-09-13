import connectToDB from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT_KEY = "systemPrompt";
const DEFAULT_PROMPT = "You are a helpful AI assistant.";

/**
 * @route GET /api/settings
 * @desc Get the current system prompt
 */
export async function GET() {
  try {
    await connectToDB();
    const setting = await Setting.findOne({ key: SYSTEM_PROMPT_KEY });
    return NextResponse.json({ prompt: setting?.value || DEFAULT_PROMPT });
  } catch (error) {
    console.error("[SETTINGS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * @route POST /api/settings
 * @desc Update the system prompt
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (typeof prompt !== "string") {
      return new NextResponse("Prompt must be a string", { status: 400 });
    }

    await connectToDB();
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: SYSTEM_PROMPT_KEY },
      { value: prompt },
      { upsert: true, new: true } // Create if it doesn't exist
    );

    return NextResponse.json({
      message: "System prompt updated",
      prompt: updatedSetting.value,
    });
  } catch (error) {
    console.error("[SETTINGS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
