import connectToDB from "@/lib/mongodb";
import ApiKey from "@/models/ApiKey";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route DELETE /api/keys/:id
 * @desc Delete a specific API key
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse("API Key ID is required", { status: 400 });
    }
    await connectToDB();
    const deletedKey = await ApiKey.findByIdAndDelete(id);
    if (!deletedKey) {
      return new NextResponse("API Key not found", { status: 404 });
    }
    return NextResponse.json({ message: "API Key deleted successfully" });
  } catch (error) {
    console.error("[KEY_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
