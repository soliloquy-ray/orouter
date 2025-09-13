"use client";
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, KeyRound } from 'lucide-react';

interface ApiKey {
  _id: string;
  key: string;
}

interface ApiKeyManagerProps {
  apiKeys: ApiKey[];
  newApiKey: string;
  setNewApiKey: (value: string) => void;
  handleAddApiKey: () => void;
  handleDeleteApiKey: (id: string) => void;
}

export default function ApiKeyManager({ apiKeys, newApiKey, setNewApiKey, handleAddApiKey, handleDeleteApiKey }: ApiKeyManagerProps) {
  const [isKeysVisible, setIsKeysVisible] = useState(false);

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="border-t border-gray-700 pt-4">
      <button
        onClick={() => setIsKeysVisible(!isKeysVisible)}
        className="flex justify-between items-center w-full text-sm font-medium text-gray-300 mb-2"
      >
        <span>API Key Management</span>
        {isKeysVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isKeysVisible && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Add new OpenRouter key"
              className="flex-grow p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button onClick={handleAddApiKey} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-700"><Plus size={16} /></button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
              {apiKeys.map(key => (
                  <div key={key._id} className="flex justify-between items-center bg-gray-800 p-1.5 rounded-md text-xs">
                      <span className="font-mono flex items-center gap-2"><KeyRound size={12}/> {maskApiKey(key.key)}</span>
                      <button onClick={() => handleDeleteApiKey(key._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
