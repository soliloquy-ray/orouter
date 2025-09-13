import connectToDB from "@/lib/mongodb";
import ApiKey from "@/models/ApiKey";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route GET /api/keys
 * @desc Get all API keys
 */
export async function GET() {
  try {
    await connectToDB();
    const keys = await ApiKey.find({}).sort({ lastUsed: "desc" });
    return NextResponse.json(keys);
  } catch (error) {
    console.error("[KEYS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * @route POST /api/keys
 * @desc Add a new API key
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return new NextResponse("A valid API key string is required", {
        status: 400,
      });
    }

    await connectToDB();
    const newKey = new ApiKey({ key });
    await newKey.save();

    return NextResponse.json(newKey, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return new NextResponse("This API key already exists.", { status: 409 });
    }
    console.error("[KEYS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
