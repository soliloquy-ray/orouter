import React, { useState, useEffect, useRef } from 'react';
import { Send, Maximize } from 'lucide-react';
import { useMediaQuery } from '@/hooks/';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
  onMobileInputClick: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, onMobileInputClick }) => {
  // --- STATE DECOUPLING ---
  // This component now manages its own input state.
  // The parent page is no longer re-rendered on every keystroke.
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSend(inputValue);
      setInputValue(''); // Clear the local input state after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMobile) {
    return (
      <div 
        className="p-4 bg-gray-900 border-t border-gray-700 cursor-pointer"
        onClick={onMobileInputClick}
      >
        <div className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-md text-gray-400">
          <span>Type a message...</span>
          <Maximize size={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700">
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full px-3 py-2 pr-12 text-sm bg-gray-800 border border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-48"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-2 bottom-2 p-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;

