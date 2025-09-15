"use client";

import { Conversation } from "@/types";
import { Plus, Trash2 } from 'lucide-react';
import SystemPrompt from "./SystemPrompt";
import ApiKeyManager from "./ApiKeyManager";

interface ApiKey {
  _id: string;
  key: string;
  lastUsed: string;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string) => void;
  handleNewConversation: () => void;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  
  handleSaveSystemPrompt: (prompt: string) => void;
  isSavingPrompt: boolean;

  apiKeys: ApiKey[];
  newApiKey: string;
  setNewApiKey: (value: string) => void;
  handleAddApiKey: () => void;
  handleDeleteApiKey: (id: string) => void;
}

export default function Sidebar({ 
  conversations, currentConversationId, setCurrentConversationId, handleNewConversation, handleDeleteConversation, handleSaveSystemPrompt, isSavingPrompt,
  apiKeys, newApiKey, setNewApiKey, handleAddApiKey, handleDeleteApiKey
 }: SidebarProps) {
  
  return (
    <aside className="w-full md:w-72 bg-gray-950 p-4 flex flex-col h-full">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-bold mb-4">Conversations</h1>
        <button
          onClick={handleNewConversation}
          className="flex items-center w-full p-2 mb-4 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          New Chat
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 mb-4">
        {conversations.map((conv) => (
          <div
            key={conv._id}
            onClick={() => setCurrentConversationId(conv._id)}
            className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${
              currentConversationId === conv._id
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            <span className="truncate">{conv.title}</span>
            <button
              onClick={(e) => handleDeleteConversation(e, conv._id)}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 space-y-4">
        <SystemPrompt 
            handleSaveSystemPrompt={handleSaveSystemPrompt}
            isSavingPrompt={isSavingPrompt}
        />
        <ApiKeyManager 
            apiKeys={apiKeys}
            newApiKey={newApiKey}
            setNewApiKey={setNewApiKey}
            handleAddApiKey={handleAddApiKey}
            handleDeleteApiKey={handleDeleteApiKey}
        />
      </div>
    </aside>
  );
}
