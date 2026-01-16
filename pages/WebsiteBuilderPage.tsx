import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Message } from '../types';
import { generateWebsiteStream } from '../services/geminiService';
import { COST_PER_WEBSITE } from '../constants.tsx';

interface WebsiteBuilderPageProps {
  user: User;
  updateCredits: (balance: number) => void;
}

const WebsiteBuilderPage: React.FC<WebsiteBuilderPageProps> = ({ user, updateCredits }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Default placeholder code
  const placeholderCode = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      </style>
    </head>
    <body class="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center min-h-screen text-center p-6">
      <div class="space-y-8 max-w-lg">
        <div class="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white rounded-[32px] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-emerald-200 animate-float">
           <i class="fa-solid fa-layer-group"></i>
        </div>
        <div>
          <h1 class="text-5xl font-black text-gray-900 tracking-tight mb-4">Web Architect</h1>
          <p class="text-gray-500 text-lg leading-relaxed">
            I plan, reason, and build interactive applications. 
            <br/><span class="text-emerald-600 font-bold">Try: "Build a functional Todo App with local storage"</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const extractCode = (text: string) => {
    // Look for standard markdown code blocks
    const htmlRegex = /```html\s*([\s\S]*?)\s*```/;
    const genericRegex = /```\s*([\s\S]*?)\s*```/;
    
    const htmlMatch = text.match(htmlRegex);
    if (htmlMatch && htmlMatch[1]) return htmlMatch[1];
    
    const genericMatch = text.match(genericRegex);
    if (genericMatch && genericMatch[1]) return genericMatch[1];

    // If no markdown blocks, but text contains basic HTML structure, return the text
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return text;
    }

    return null;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (user.credits < COST_PER_WEBSITE) {
      alert(`Insufficient credits. You need ${COST_PER_WEBSITE} CR to generate a website.`);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: 'Reasoning about architecture...',
      timestamp: Date.now(),
      isGenerating: true
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
      const stream = await generateWebsiteStream(newMessage.content, newMessages);
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk.text || '';
        
        // Try to update preview in real-time if enough code exists
        const partialCode = extractCode(fullText);
        if (partialCode && partialCode.length > 50) {
            setGeneratedCode(partialCode);
        }

        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullText } : m));
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullText, isGenerating: false } : m));
      
      const finalCode = extractCode(fullText);
      if (finalCode) {
        setGeneratedCode(finalCode);
        updateCredits(user.credits - COST_PER_WEBSITE);
      }

    } catch (error: any) {
      console.error(error);
      
      let errorMessage = "Error generating website code. Please try again.";
      if (error.message && error.message.includes("API_KEY_MISSING")) {
        errorMessage = "API Key is missing. Please set your API Key in Settings (gear icon).";
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: errorMessage, isGenerating: false } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 font-['Plus_Jakarta_Sans']">
      {/* Left Pane: Chat */}
      <div className="w-full md:w-1/3 flex flex-col border-r border-gray-200 bg-white z-10 shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
           <div className="flex items-center space-x-3">
             <Link to="/dashboard" className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
               <i className="fa-solid fa-arrow-left text-sm"></i>
             </Link>
             <div>
                <h2 className="font-black text-gray-900 tracking-tight text-sm">Web Architect</h2>
                <div className="flex items-center space-x-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gemini 3 Pro</span>
                </div>
             </div>
           </div>
           <div className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100">
             {COST_PER_WEBSITE} CR
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-white">
           {messages.length === 0 && (
             <div className="mt-10 text-center px-6">
               <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4 text-2xl shadow-lg shadow-orange-100">
                 <i className="fa-solid fa-wand-magic-sparkles"></i>
               </div>
               <p className="text-sm font-black text-gray-900 mb-2">Advanced Generation</p>
               <p className="text-xs text-gray-500 leading-relaxed">
                 "Create a personal portfolio with a contact form and project gallery."
                 <br/><br/>
                 "Build a calorie calculator with sliders and a results chart."
               </p>
             </div>
           )}
           {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
               <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                 {msg.role === 'user' ? (
                   msg.content
                 ) : (
                    <div className="prose prose-sm max-w-none">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Architect AI</span>
                       {msg.isGenerating && (
                         <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                           <i className="fa-solid fa-circle-notch animate-spin"></i>
                           <span>Planning architecture...</span>
                         </div>
                       )}
                       {!msg.isGenerating && (
                           <div className="line-clamp-4 opacity-70 text-xs font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-600">
                             {msg.content.substring(0, 200)}...
                           </div>
                       )}
                       {!msg.isGenerating && !msg.content.includes("Error") && <div className="mt-3 text-[10px] text-emerald-600 font-black uppercase flex items-center"><i className="fa-solid fa-check-circle mr-1.5"></i> Website Deployed</div>}
                       {!msg.isGenerating && msg.content.includes("Error") && <div className="mt-3 text-[10px] text-red-500 font-black uppercase flex items-center"><i className="fa-solid fa-circle-exclamation mr-1.5"></i> Generation Failed</div>}
                    </div>
                 )}
               </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative shadow-sm rounded-xl">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your dream website..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-2 bottom-2 w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md shadow-emerald-200"
            >
              <i className={`fa-solid ${isLoading ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'} text-xs`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Right Pane: Preview */}
      <div className="hidden md:flex flex-1 flex-col relative bg-gray-100/50 p-6 md:p-8 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
           <div className="flex bg-gray-200 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('desktop')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${viewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <i className="fa-solid fa-desktop mr-2"></i> Desktop
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${viewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <i className="fa-solid fa-mobile-screen mr-2"></i> Mobile
              </button>
           </div>
           
           {generatedCode && (
             <button 
               onClick={() => {
                 const blob = new Blob([generatedCode], { type: 'text/html' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = 'website.html';
                 a.click();
               }}
               className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all flex items-center"
             >
               <i className="fa-solid fa-download mr-2"></i> Export Code
             </button>
           )}
        </div>

        <div className="flex-1 flex justify-center items-start overflow-hidden">
           <div className={`transition-all duration-500 ease-in-out bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col ${viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}>
              <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4 space-x-2 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  <div className="flex-1 mx-4 bg-white h-5 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                    localhost:3000
                  </div>
              </div>
              <iframe 
                srcDoc={generatedCode || placeholderCode}
                title="Preview" 
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-modals allow-forms allow-popups" 
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;