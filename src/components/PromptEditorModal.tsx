import { SendHorizonal, X } from 'lucide-react';
import { useState } from 'react';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleSend: (messageContent: string) => void;
  isLoading: boolean;
}

const PromptEditorModal = ({ isOpen, onClose, handleSend, isLoading }: PromptEditorModalProps) => {
  // --- STATE DECOUPLING ---
  // This component now manages its own input state internally
  // to prevent re-rendering the entire page on each keystroke.
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      handleSend(prompt);
      setPrompt(''); // Clear local state after sending
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col p-4">
      <div className="w-full flex justify-end mb-2">
        <button onClick={onClose} className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600">
          <X size={24} />
        </button>
      </div>
      <div className="flex-grow flex flex-col bg-gray-800 rounded-lg p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your message..."
          className="w-full h-full bg-transparent text-white text-lg resize-none focus:outline-none flex-grow"
          autoFocus
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendHorizonal size={20} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorModal;
