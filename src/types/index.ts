export type Role = "user" | "assistant" | "system";

export interface Message {
  role: Role;
  content: string;
}

export interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
