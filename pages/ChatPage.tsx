
import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Message, MessagePart, ChatMode, ChatSession, GroundingChunk } from '../types';
import { generateAIResponseStream, processImageRequest } from '../services/geminiService';
import { Logo, COST_PER_MESSAGE, COST_PER_IMAGE } from '../constants.tsx';

// Define the missing ChatPageProps interface
interface ChatPageProps {
  user: User;
  updateCredits: (balance: number) => void;
}

const CodeBlock = ({ language, children }: { language: string, children?: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const content = String(children || '').replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-4 border border-gray-700 bg-[#282c34] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-gray-700">
        <span className="text-xs font-bold text-gray-400 lowercase font-mono">{language || 'code'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <><i className="fa-solid fa-check text-emerald-500"></i><span className="text-emerald-500">Copied!</span></>
          ) : (
            <><i className="fa-regular fa-copy"></i><span>Copy</span></>
          )}
        </button>
      </div>
      <SyntaxHighlighter 
        language={language || 'text'} 
        style={oneDark} 
        customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
        wrapLongLines={true}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

const SuggestionCard = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="p-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-200 rounded-2xl text-left transition-all hover:shadow-lg hover:shadow-emerald-50/50 group flex items-start space-x-3 w-full"
  >
    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors shrink-0">
      <i className={`fa-solid ${icon} text-xs`}></i>
    </div>
    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 leading-relaxed mt-1">{text}</span>
  </button>
);

const ChatPage: React.FC<ChatPageProps> = ({ user, updateCredits }) => {
  const { mode = 'general' } = useParams<{ mode: string }>();
  const chatMode = mode as ChatMode;
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useProModel, setUseProModel] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{file: File, base64: string, type: 'image', mimeType: string}[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`croc_sessions_${user.id}`);
    if (saved) {
      try {
        const parsed: ChatSession[] = JSON.parse(saved);
        setSessions(parsed);
        const modeSessions = parsed.filter(s => s.mode === chatMode);
        if (modeSessions.length > 0) {
          const latest = modeSessions[0];
          setActiveSessionId(latest.id);
          setMessages(latest.messages);
        } else {
          handleNewChat(parsed);
        }
      } catch (e) {
        handleNewChat([]);
      }
    } else {
      handleNewChat([]);
    }
  }, [user.id, chatMode]);

  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem(`croc_sessions_${user.id}`, JSON.stringify(updatedSessions));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = (currentSessions = sessions) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      mode: chatMode,
      messages: [],
      updatedAt: Date.now()
    };
    const updated = [newSession, ...currentSessions];
    saveSessions(updated);
    setActiveSessionId(newId);
    setMessages([]);
    setInputValue('');
    setAttachedFiles([]);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setAttachedFiles([]);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) handleSelectSession(updated[0].id);
      else handleNewChat(updated);
    }
  };

  // Fixed type issues by explicitly casting files array
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      if (!file.type.startsWith('image')) continue;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, { file, base64, type: 'image', mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleProcess = async (isExplicitImageGen: boolean = false, overridePrompt?: string) => {
    if (isLoading || !activeSessionId) return;
    const isImageMode = chatMode === 'image' || isExplicitImageGen;
    const cost = isImageMode ? COST_PER_IMAGE : COST_PER_MESSAGE;

    if (user.credits < cost) {
      alert(`Insufficient credits. You need ${cost} CR.`);
      return;
    }

    const promptText = overridePrompt || inputValue.trim();
    if (!promptText && attachedFiles.length === 0) return;

    const uploads = [...attachedFiles];
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    const userParts: MessagePart[] = [];
    if (promptText) userParts.push({ text: promptText });
    uploads.forEach(u => {
      userParts.push({ 
        imageUrl: `data:${u.mimeType};base64,${u.base64}`,
        inlineData: { mimeType: u.mimeType, data: u.base64 }
      });
    });

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText || "Multimedia Message",
      parts: userParts,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: "Thinking...",
      timestamp: Date.now(),
      isGenerating: true
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
      if (isImageMode) {
        const inputImg = uploads.length > 0 ? { base64: uploads[0].base64, mimeType: uploads[0].mimeType } : undefined;
        const resultUrl = await processImageRequest(promptText || "Create art", inputImg);
        const finishedAiMsg: Message = { 
          ...aiMsg, content: "", parts: [{ imageUrl: resultUrl }], isGenerating: false 
        };
        setMessages(prev => prev.map(m => m.id === aiMsgId ? finishedAiMsg : m));
        updateCredits(user.credits - COST_PER_IMAGE);
      } else {
        const stream = generateAIResponseStream(promptText, updatedMessages, chatMode, userParts, useProModel);
        let fullText = '';
        let groundingChunks: GroundingChunk[] = [];
        for await (const chunk of stream) {
          fullText += chunk.text || '';
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            groundingChunks = [...groundingChunks, ...chunk.candidates[0].groundingMetadata.groundingChunks];
          }
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { 
            ...m, 
            content: fullText, 
            isGenerating: false,
            groundingMetadata: groundingChunks.length > 0 ? { groundingChunks } : undefined
          } : m));
        }
        updateCredits(user.credits - COST_PER_MESSAGE);
      }
    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: `Error: ${error.message}`, isGenerating: false } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-gray-900 overflow-hidden font-['Plus_Jakarta_Sans']">
      {isSidebarOpen && (
        <div className="w-72 flex flex-col bg-gray-50 border-r border-gray-100 p-4 shrink-0 transition-all">
          <button onClick={() => handleNewChat()} className="flex items-center space-x-3 w-full p-4 mb-6 rounded-2xl bg-white border border-gray-100 hover:border-emerald-500 hover:shadow-xl transition-all group">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><i className="fa-solid fa-plus text-xs"></i></div>
            <span className="text-sm font-bold text-gray-700">New Chat</span>
          </button>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {sessions.filter(s => s.mode === chatMode).map(s => (
              <div key={s.id} onClick={() => handleSelectSession(s.id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${activeSessionId === s.id ? 'bg-white border border-gray-200 shadow-md' : 'hover:bg-gray-100'}`}>
                <div className="flex items-center space-x-3 min-w-0">
                  <i className={`fa-solid ${chatMode === 'image' ? 'fa-palette' : 'fa-message'} text-[10px] ${activeSessionId === s.id ? 'text-emerald-600' : 'text-gray-300'}`}></i>
                  <span className={`text-xs font-bold truncate ${activeSessionId === s.id ? 'text-gray-900' : 'text-gray-500'}`}>{s.title}</span>
                </div>
                <button onClick={(e) => handleDeleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-emerald-600 transition-colors"><i className="fa-solid fa-bars-staggered"></i></button>
            <div className="flex items-center">
              <Logo className="w-8 h-8 mr-3" />
              <h1 className="text-xs font-black text-gray-400 uppercase tracking-widest">{chatMode.toUpperCase()} STUDIO</h1>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
             <button onClick={() => setUseProModel(false)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${!useProModel ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>FLASH</button>
             <button onClick={() => setUseProModel(true)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${useProModel ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>PRO</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
            {messages.length === 0 ? (
               <div className="text-center py-20 animate-fadeIn">
                  <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">How can I help you today?</h2>
                  <p className="text-gray-400 font-medium mb-12">I'm CrocSthepen AI, your versatile intelligence engine.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                    <SuggestionCard icon="fa-newspaper" text="Latest tech news from Google Search" onClick={() => handleProcess(false, "Search for the latest technology news today.")} />
                    <SuggestionCard icon="fa-code" text="Help me debug a React useEffect hook" onClick={() => handleProcess(false, "Can you explain how to fix infinite loops in React useEffect hooks?")} />
                  </div>
               </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                   <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-6 rounded-[32px] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none prose-emerald">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ className, children }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? <CodeBlock language={match[1]}>{children}</CodeBlock> : <code className={className}>{children}</code>;
                            }}}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : <div className="whitespace-pre-wrap font-medium">{msg.content}</div>}

                        {msg.parts?.map((part, idx) => (
                          <div key={idx} className="mt-4">
                            {part.imageUrl && (
                              <div className="relative group rounded-2xl overflow-hidden border border-gray-100 shadow-md">
                                <img src={part.imageUrl} alt="Generated" className="max-w-full h-auto" />
                                <a href={part.imageUrl} download={`CrocAI-${Date.now()}.png`} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl text-gray-900 hover:bg-emerald-600 hover:text-white">
                                  <i className="fa-solid fa-download"></i>
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {msg.role === 'assistant' && msg.groundingMetadata?.groundingChunks && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.groundingMetadata.groundingChunks.map((chunk, idx) => chunk.web && (
                            <a key={idx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                              <i className="fa-solid fa-link"></i><span>{chunk.web.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="px-6 py-6 bg-white border-t border-gray-50 z-20">
          <div className="max-w-4xl mx-auto flex flex-col space-y-4">
            {attachedFiles.length > 0 && (
               <div className="flex gap-3 overflow-x-auto pb-2">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg shrink-0 group">
                      <img src={`data:${file.mimeType};base64,${file.base64}`} className="w-full h-full object-cover" />
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
               </div>
            )}
            <div className="relative flex items-end space-x-3">
              <div className="flex-1 relative group">
                <textarea 
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleProcess(); } }}
                  placeholder="Ask CrocSthepen anything..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-[24px] px-6 py-4 pr-16 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none max-h-40 min-h-[58px]"
                  disabled={isLoading}
                />
                <button onClick={() => fileInputRef.current?.click()} className="absolute right-4 bottom-3 w-9 h-9 text-gray-400 hover:text-emerald-600 transition-colors rounded-xl flex items-center justify-center hover:bg-emerald-50">
                  <i className="fa-solid fa-paperclip text-sm"></i>
                </button>
              </div>
              <button 
                onClick={() => handleProcess()}
                disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
                className="w-[58px] h-[58px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-[22px] flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-emerald-200 disabled:opacity-40 shrink-0"
              >
                {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
