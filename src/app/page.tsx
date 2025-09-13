"use client";

import { useState, useEffect } from "react";
import { Message, Conversation } from "@/types";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import { Menu, X } from "lucide-react";
import PromptEditorModal from "@/components/PromptEditorModal";

interface ApiKey {
  _id: string;
  key: string;
  lastUsed: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newApiKey, setNewApiKey] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState(0);
  const [totalBranches, setTotalBranches] = useState(1);
  
  // Flag to prevent race conditions on new chat creation
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchSystemPrompt();
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API Interaction
  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      setApiKeys(await response.json());
    } catch (error) { console.error(error); }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.trim()) return;
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newApiKey }),
      });
      if (!response.ok) throw new Error("Failed to add key");
      setNewApiKey("");
      fetchApiKeys();
    } catch (error) {
      console.error(error);
      alert("Failed to add API Key. It might already exist.");
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await fetch(`/api/keys/${id}`, { method: "DELETE" });
        fetchApiKeys();
      } catch (error) { console.error("Failed to delete API Key", error); }
    }
  };

  const fetchSystemPrompt = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch system prompt");
      const data = await response.json();
      if(data?.prompt) setSystemPrompt(data.prompt);
    } catch (error) { console.error(error); }
  };

  const handleSaveSystemPrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: systemPrompt }),
      });
    } catch (error) { console.error("Failed to save prompt", error); } 
    finally { setIsSavingPrompt(false); }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) throw new Error("Failed to fetch conversations");
      const data: Conversation[] = await response.json();
      setConversations(data);
      if (data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0]._id);
      }
    } catch (error) { console.error(error); }
  };

  const fetchMessages = async (conversationId: string) => {
      if (!currentConversationId || isCreatingNewChat) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages);
      setActiveBranch(data.activeBranch);
      setTotalBranches(data.totalBranches);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (currentConversationId && !isSwitching) {
      fetchMessages(currentConversationId);
    } else {
      if (isSwitching) setIsSwitching(false);
      if (!currentConversationId) {
        setMessages([]);
        setActiveBranch(0);
        setTotalBranches(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId, isSwitching]);

  const handleNewConversation = async () => {
    try {
      setIsCreatingNewChat(true);
      const response = await fetch("/api/conversations", { method: "POST" });
      if (!response.ok) throw new Error("Failed to create conversation");
      const newConv: Conversation = await response.json();
      setConversations([newConv, ...conversations]);
      setIsSwitching(true);
      setCurrentConversationId(newConv._id);
      setMessages([]);
      setActiveBranch(0);
      setTotalBranches(1);
      setIsSidebarOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete conversation");
        const remaining = conversations.filter((c) => c._id !== id);
        setConversations(remaining);
        if (currentConversationId === id) {
          const newId = remaining.length > 0 ? remaining[0]._id : null;
          setCurrentConversationId(newId);
          if (!newId) setMessages([]);
        }
      } catch (error) { console.error(error); }
    }
  };
  
  const handleSetCurrentConversationId = (id: string) => {
    setCurrentConversationId(id);
    setIsSidebarOpen(false);
  }

  const handleSend = async (messageContent: string) => {
    if (!messageContent.trim() || !currentConversationId) return;
    
    const userMessage: Message = { role: "user", content: messageContent };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);

    await streamResponse(currentConversationId, newMessages);
  };

  const handleEditAndBranch = async (index: number, newContent: string) => {
    if (!currentConversationId) return;

    const historyForBranch = messages.slice(0, index);
    const userMessage: Message = { role: "user", content: newContent };
    const newMessages = [...historyForBranch, userMessage];
    
    setMessages(newMessages);

    await streamResponse(currentConversationId, newMessages, index);
  };

  const streamResponse = async (convoId: string, messagesForApi: Message[], branchFromIndex?: number) => {
    const originalMessages = messages; // Keep a copy for error recovery
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convoId,
          messages: messagesForApi,
          systemPrompt: systemPrompt,
          branchFromIndex: branchFromIndex,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";
      setMessages([...messagesForApi, { role: "assistant", content: "" }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantResponse += decoder.decode(value, { stream: true });
        setMessages([...messagesForApi, { role: "assistant", content: assistantResponse }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setMessages(originalMessages); // Revert to state before the send/edit on error
    } finally {
      setIsLoading(false);
      await fetchMessages(convoId); // This will sync messages, activeBranch, and totalBranches
      await fetchConversations(); 
    }
  };

  const handleSwitchBranch = async (direction: 'prev' | 'next') => {
      if (!currentConversationId) return;
      const newBranch = direction === 'prev' ? activeBranch - 1 : activeBranch + 1;
      if (newBranch < 0 || newBranch >= totalBranches) return;

      try {
          setIsLoading(true);
          const response = await fetch(`/api/conversations/${currentConversationId}/switch-branch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ branchIndex: newBranch }),
          });
          if (!response.ok) throw new Error("Failed to switch branch");
          // Re-fetch messages to get the new branch's content
          await fetchMessages(currentConversationId);
      } catch (error) {
          console.error("Error switching branch", error);
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
      <div className="absolute top-2 left-2 z-20 md:hidden">
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-800 rounded-md">
            {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      <div className={`absolute top-0 left-0 h-full z-10 w-72 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:flex`}>
         <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            setCurrentConversationId={handleSetCurrentConversationId}
            handleNewConversation={handleNewConversation}
            handleDeleteConversation={handleDeleteConversation}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            handleSaveSystemPrompt={handleSaveSystemPrompt}
            isSavingPrompt={isSavingPrompt}
            apiKeys={apiKeys}
            newApiKey={newApiKey}
            setNewApiKey={setNewApiKey}
            handleAddApiKey={handleAddApiKey}
            handleDeleteApiKey={handleDeleteApiKey}
        />
      </div>
      
      <div className="flex-1 flex flex-col h-full">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          handleSend={handleSend}
          handleEditAndBranch={handleEditAndBranch}
          currentConversationId={currentConversationId}
          activeBranch={activeBranch}
          totalBranches={totalBranches}
          handleSwitchBranch={handleSwitchBranch}
          onMobileInputClick={() => setIsPromptModalOpen(true)}
        />
      </div>
      
      <PromptEditorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        handleSend={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
}

