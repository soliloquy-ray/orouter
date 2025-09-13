import mongoose, { Document, Schema, Model } from "mongoose";
import { Message } from "@/types";

// Schema for an individual message
const messageSchema = new Schema<Message>(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
  },
  { _id: false } // Don't create separate _id for each message in the array
);

// Schema for a single conversational branch, which contains messages
const branchSchema = new Schema(
  {
    messages: [messageSchema],
  },
  { _id: false }
);

// Interface for the main Conversation document
export interface IConversation extends Document {
  title: string;
  activeBranch: number;
  branches: { messages: Message[] }[];
  createdAt: Date;
}

// Schema for the Conversation document
const conversationSchema = new Schema<IConversation>({
  title: { type: String, required: true },
  activeBranch: { type: Number, default: 0 },
  branches: [branchSchema], // A conversation can have multiple branches
  createdAt: { type: Date, default: Date.now },
});

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;

