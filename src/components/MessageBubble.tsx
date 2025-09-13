import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { useMediaQuery } from '@/hooks/';
import { Bot, User, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  onEdit: (newContent: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onEdit }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Refs for long press logic
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchMoveThreshold = 10; // pixels
  const touchStartPosition = useRef<{ x: number, y: number } | null>(null);

  const isBot = message.role === 'assistant';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editedContent]);
  
  const handleSave = () => {
    onEdit(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  // --- Long Press Handlers for Mobile ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isEditing) return;
    touchStartPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    longPressTimer.current = setTimeout(() => {
        setIsEditing(true);
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressTimer.current || !touchStartPosition.current) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartPosition.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartPosition.current.y);

    // If finger moves too much, cancel the long press
    if (deltaX > touchMoveThreshold || deltaY > touchMoveThreshold) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  return (
    <div className={`flex items-start gap-0 md:gap-4 group ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`hidden md:block md:flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-indigo-500' : 'bg-blue-500'}`}>
        {isBot ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
      </div>
      <div 
        className={`relative rounded-lg py-3 md:w-[60dvw] w-[100dvw] ${isBot ? 'bg-gray-700 text-white ps-4' : 'bg-gray-600 text-white pe-4'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
               
        <button onClick={() => setIsCollapsed(!isCollapsed)} className={`absolute bg-gray-600 p-1 z-10 rounded-full text-white hover:bg-gray-500 transition-all h-full ${!isBot ? "right-0" : "left-0"}  top-0 w-4`}>
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                 </button>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-[80dvh]"
              rows={1}
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 p-2 rounded-md"><Check size={16} /></button>
              <button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 p-2 rounded-md"><X size={16} /></button>
            </div>
          </div>
        ) : (
          <>
            <div className={`prose prose-invert max-w-none prose-p:my-0 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 ${isCollapsed ? 'max-h-24 overflow-hidden' : ''}`}>
               <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
            {!isEditing && (
              <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Only show the hover-to-edit button on desktop */}
                 {!isMobile && (
                    <button onClick={() => setIsEditing(true)} className="bg-gray-600 p-1 rounded-full text-white hover:bg-gray-500 transition-all">
                        <Pencil size={14} />
                    </button>
                 )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

