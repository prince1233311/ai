import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    onClose();
    // Reload to ensure service instances pick up the new key immediately
    window.location.reload(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl scale-in border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <i className="fa-solid fa-xmark text-gray-400"></i>
          </button>
        </div>
        
        <div className="mb-8">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Gemini API Key</label>
          <div className="relative">
             <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
             <input 
               type="password" 
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               placeholder="AIzaSy..."
               className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-gray-800"
             />
          </div>
          <p className="mt-4 text-xs text-gray-500 leading-relaxed font-medium bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-emerald-800">
            <i className="fa-solid fa-circle-info mr-2"></i>
            Your key is stored locally in your browser. Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="font-bold underline hover:text-emerald-600">Google AI Studio</a>.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-200 transition-all transform hover:scale-105 active:scale-95">
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;