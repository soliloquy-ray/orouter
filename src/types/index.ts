export type Role = "user" | "assistant" | "system";

export interface Message {
  role: Role;
  content: string;
  reasoning?: string; // Add this line
}

export interface Conversation {
  _id: string;
  title: string;
  branches: { messages: Message[] }[];
  activeBranch: number;
  createdAt: string;
  updatedAt: string;
}