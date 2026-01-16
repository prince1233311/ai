
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { generateVideo } from '../services/geminiService';
import { COST_PER_VIDEO } from '../constants.tsx';

interface VideoPageProps {
  user: User;
  updateCredits: (balance: number) => void;
}

const VideoPage: React.FC<VideoPageProps> = ({ user, updateCredits }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progressText, setProgressText] = useState('');
  const [characterImage, setCharacterImage] = useState<{file?: File, preview: string, base64: string, mimeType: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'draw' | 'ai'>('draw');
  
  // Animation Studio State
  const [frames, setFrames] = useState<string[]>(['']);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [onionSkin, setOnionSkin] = useState(true);
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Analyzing frames...",
    "Injecting motion...",
    "Computing temporal consistency...",
    "Generating with Veo...",
    "Almost ready..."
  ];

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (frames[currentFrameIndex]) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            drawOnionSkin();
          };
          img.src = frames[currentFrameIndex];
        } else {
          drawOnionSkin();
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode, currentFrameIndex, frames.length, onionSkin]);

  const drawOnionSkin = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !onionSkin || currentFrameIndex === 0 || isPlaying) return;

    const prevFrame = frames[currentFrameIndex - 1];
    if (prevFrame) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1.0;
      };
      img.src = prevFrame;
    }
  };

  const saveCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setFrames(prev => {
        const next = [...prev];
        next[currentFrameIndex] = dataUrl;
        return next;
      });
      return dataUrl;
    }
    return null;
  };

  const addFrame = () => {
    saveCurrentFrame();
    const newIndex = frames.length;
    setFrames(prev => [...prev, '']);
    setCurrentFrameIndex(newIndex);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) {
      clearCanvas();
      return;
    }
    const nextFrames = frames.filter((_, i) => i !== index);
    setFrames(nextFrames);
    setCurrentFrameIndex(Math.max(0, index - 1));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      const nextFrames = [...frames];
      nextFrames[currentFrameIndex] = '';
      setFrames(nextFrames);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCurrentFrame();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    } else {
      x = ((e as React.MouseEvent).clientX - rect.left) * (canvas.width / rect.width);
      y = ((e as React.MouseEvent).clientY - rect.top) * (canvas.height / rect.height);
    }

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps]);

  const handleDownloadAnimation = async () => {
    if (frames.length === 0) return;
    setIsPlaying(false);
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 450;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const stream = exportCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `croc-drawing-${Date.now()}.webm`;
      a.click();
    };

    recorder.start();

    for (const frameData of frames) {
      if (!frameData) continue;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
          ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
          resolve();
        };
        img.src = frameData;
      });
      await new Promise(r => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCharacterImage({
            file,
            preview: result,
            base64: result.split(',')[1],
            mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const checkKeyAndGenerate = async () => {
    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      handleGenerateAI();
    } catch (e) {
      setError("Failed to verify API Key selection.");
    }
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim() && !characterImage && frames.length === 0) {
      setError("Please provide content to refine.");
      return;
    }
    
    if (user.credits < COST_PER_VIDEO) {
      setError(`Insufficient credits. You need ${COST_PER_VIDEO} CR.`);
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);
    let msgIdx = 0;
    setProgressText(loadingMessages[0]);
    const progressInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % loadingMessages.length;
        setProgressText(loadingMessages[msgIdx]);
    }, 4000);

    try {
        let refBase64 = characterImage?.base64;
        let refMime = characterImage?.mimeType;

        if (mode === 'draw' && !refBase64 && frames[currentFrameIndex]) {
          refBase64 = frames[currentFrameIndex].split(',')[1];
          refMime = 'image/png';
        }

        const url = await generateVideo(prompt || "Animate this sketch", aspectRatio, refBase64, refMime);
        setVideoUrl(url);
        updateCredits(user.credits - COST_PER_VIDEO);
    } catch (err: any) {
        console.error("AI Error:", err);
        if (err.message?.includes("PERMISSION_DENIED") || err.message?.includes("403")) {
          setError("API Permission Denied. Please ensure you've selected a PAID API Key.");
          (window as any).aistudio.openSelectKey();
        } else {
          setError(err.message || "AI Enhancement failed.");
        }
    } finally {
        clearInterval(progressInterval);
        setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-['Plus_Jakarta_Sans'] text-gray-900">
        <div className="w-full md:w-[420px] flex flex-col border-r border-gray-100 bg-gray-50/30 overflow-y-auto custom-scrollbar p-6">
            <div className="flex items-center space-x-4 mb-8">
                <Link to="/dashboard" className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-gray-100">
                    <i className="fa-solid fa-arrow-left"></i>
                </Link>
                <div>
                    <h2 className="font-black text-gray-900 tracking-tight uppercase text-sm">Drawing Studio</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frame-by-Frame Animator</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                   <button 
                     onClick={() => setMode('draw')}
                     className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'draw' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     Sketch
                   </button>
                   <button 
                     onClick={() => setMode('ai')}
                     className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     AI Refine
                   </button>
                </div>

                {mode === 'draw' ? (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tools</label>
                        <div className="flex space-x-2">
                           <button onClick={() => setOnionSkin(!onionSkin)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${onionSkin ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`} title="Onion Skin">
                             <i className="fa-solid fa-layer-group text-xs"></i>
                           </button>
                           <button onClick={clearCanvas} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                             <i className="fa-solid fa-eraser text-xs"></i>
                           </button>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</span>
                           <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-6 h-6 rounded border-none p-0 bg-transparent cursor-pointer" />
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-gray-100 flex items-center space-x-3">
                           <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="flex-1 accent-emerald-500" />
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</span>
                           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{fps} FPS</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                           {frames.map((f, i) => (
                             <div 
                               key={i} 
                               onClick={() => { saveCurrentFrame(); setCurrentFrameIndex(i); }}
                               className={`relative w-16 h-12 rounded-lg border-2 shrink-0 cursor-pointer transition-all overflow-hidden bg-white ${currentFrameIndex === i ? 'border-emerald-500 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                             >
                                {f && <img src={f} className="w-full h-full object-cover" />}
                                {currentFrameIndex === i && (
                                   <button onClick={(e) => { e.stopPropagation(); deleteFrame(i); }} className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-bl-md"><i className="fa-solid fa-xmark text-[6px]"></i></button>
                                )}
                             </div>
                           ))}
                           <button onClick={addFrame} className="w-16 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:text-emerald-500 transition-all"><i className="fa-solid fa-plus text-xs"></i></button>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div onClick={() => fileInputRef.current?.click()} className={`relative w-full h-40 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${characterImage ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}>
                       {characterImage ? <img src={characterImage.preview} className="w-full h-full object-contain" /> : <span className="text-[10px] font-black text-gray-400 uppercase">Upload Reference</span>}
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                    <textarea 
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="Describe the desired movement..."
                       className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:border-emerald-500 outline-none transition-all h-24"
                    />
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100 space-y-4">
                    <button onClick={handleDownloadAnimation} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-black flex items-center justify-center">
                       <i className="fa-solid fa-download mr-3"></i> Download Drawing (Free)
                    </button>
                    
                    <button 
                       onClick={checkKeyAndGenerate}
                       disabled={loading}
                       className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:bg-emerald-500 transform hover:scale-105 disabled:opacity-40 flex items-center justify-center"
                    >
                       {loading ? <i className="fa-solid fa-circle-notch animate-spin mr-3"></i> : <i className="fa-solid fa-wand-sparkles mr-3"></i>}
                       AI Refine ({COST_PER_VIDEO} CR)
                    </button>
                    <p className="text-[9px] text-gray-400 text-center uppercase tracking-widest font-bold">
                       Note: AI Refine requires a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline text-emerald-600">PAID API Key</a>
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-100/30 p-8 items-center justify-center relative overflow-hidden">
            {mode === 'draw' && !videoUrl ? (
              <div className="w-full max-w-4xl h-full flex flex-col space-y-6">
                 <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-gray-100 relative overflow-hidden">
                    <canvas 
                      ref={canvasRef} width={800} height={450}
                      className="w-full h-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl space-x-6">
                       <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-emerald-400 transition-colors">
                          <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                       </button>
                       <div className="h-6 w-px bg-white/20"></div>
                       <input type="range" min="1" max="24" value={fps} onChange={(e) => setFps(parseInt(e.target.value))} className="w-24 accent-emerald-500" />
                    </div>
                 </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {loading ? (
                   <div className="text-center">
                      <div className="w-20 h-20 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                      <p className="text-sm font-black text-emerald-600 uppercase tracking-widest animate-pulse">{progressText}</p>
                   </div>
                ) : videoUrl ? (
                   <div className="relative group w-full h-full max-w-5xl rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 bg-white">
                      <video src={videoUrl} autoPlay loop controls className="w-full h-full object-contain" />
                      <button onClick={() => setVideoUrl(null)} className="absolute top-8 left-8 bg-gray-900 text-white p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black">
                         <i className="fa-solid fa-arrow-left mr-2"></i> Back to Canvas
                      </button>
                   </div>
                ) : (
                   <div className="text-center opacity-20">
                      <i className="fa-solid fa-pencil text-9xl mb-8"></i>
                      <h2 className="text-4xl font-black">Drawing Canvas</h2>
                   </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-50 border border-red-100 text-red-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl">
                 <i className="fa-solid fa-triangle-exclamation mr-3"></i>
                 {error}
              </div>
            )}
        </div>
    </div>
  );
};

export default VideoPage;
