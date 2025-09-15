import { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  handleSend: (message: string) => void;
  handleEditAndBranch: (index: number, newContent: string) => void;
  onRegenerate: (index: number) => void; // New prop for regenerating
  currentConversationId: string | null;
  activeBranch: number;
  totalBranches: number;
  handleSwitchBranch: (direction: 'prev' | 'next') => void;
  onMobileInputClick: () => void;
}

const ChatPanel = ({
  messages,
  isLoading,
  handleSend,
  handleEditAndBranch,
  currentConversationId,
  activeBranch,
  totalBranches,
  handleSwitchBranch,
  onMobileInputClick,
  onRegenerate
}: ChatPanelProps) => {
  return (
    <div id="chatPanel" className="flex flex-col h-full bg-gray-800">
      {/* Branch Navigator */}
      {currentConversationId && totalBranches > 1 && (
        <div className="flex-shrink-0 bg-gray-900/50 p-2 flex items-center justify-center space-x-4 border-b border-gray-700">
          <button 
            onClick={() => handleSwitchBranch('prev')}
            disabled={activeBranch === 0}
            className="p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium tabular-nums">
            Branch {activeBranch + 1} / {totalBranches}
          </span>
          <button 
            onClick={() => handleSwitchBranch('next')}
            disabled={activeBranch >= totalBranches - 1}
            className="p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-0 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            message={msg}
            onEdit={(newContent) => handleEditAndBranch(index, newContent)}
            onRegenerate={() => onRegenerate(index)} // Pass the regenerate handler
            isLoading={isLoading}
          />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
           <div className="flex justify-center items-center p-4">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-2 md:p-4 border-t border-gray-700 bg-gray-800">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={!currentConversationId}
          onMobileInputClick={onMobileInputClick}
        />
      </div>
    </div>
  );
};

export default ChatPanel;

