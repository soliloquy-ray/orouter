"use client";
import { Save } from 'lucide-react';

interface SystemPromptProps {
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
  handleSaveSystemPrompt: () => void;
  isSavingPrompt: boolean;
}

export default function SystemPrompt({ systemPrompt, setSystemPrompt, handleSaveSystemPrompt, isSavingPrompt }: SystemPromptProps) {
  return (
    <div className="border-t border-gray-700 pt-4">
      <label
        htmlFor="system-prompt"
        className="text-sm font-medium text-gray-300 mb-2 block"
      >
        System Prompt
      </label>
      <textarea
        id="system-prompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
        rows={4}
        placeholder="e.g., You are a helpful assistant."
      />
      <button
        onClick={handleSaveSystemPrompt}
        disabled={isSavingPrompt}
        className="flex items-center justify-center w-full p-2 mt-2 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
      >
        {isSavingPrompt ? (
          <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
        ) : (
          <><Save size={16} className="mr-2" /> Save Prompt</>
        )}
      </button>
    </div>
  );
}
