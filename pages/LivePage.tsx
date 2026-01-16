import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { connectLiveSession, decode, encode, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage, Blob } from '@google/genai';

interface LivePageProps {
  user: User;
}

const VOICES = [
  { name: 'Zephyr', description: 'Energetic & Witty' },
  { name: 'Puck', description: 'Playful & Friendly' },
  { name: 'Charon', description: 'Deep & Authoritative' },
  { name: 'Kore', description: 'Calm & Precise' },
  { name: 'Fenrir', description: 'Intense & Focused' },
];

const LivePage: React.FC<LivePageProps> = ({ user }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [noiseReduction, setNoiseReduction] = useState(true);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio Processing Helpers
  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      setStatus("Initializing...");
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true
        } 
      });
      
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolume(Math.sqrt(sum / inputData.length) * 100);

        if (sessionPromiseRef.current) {
          const pcmBlob = createBlob(inputData);
          sessionPromiseRef.current.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      sessionPromiseRef.current = connectLiveSession(
        () => {
          setStatus("Connected");
          setIsConnected(true);
        },
        async (message: LiveServerMessage) => {
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (base64EncodedAudioString && audioContextRef.current) {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), ctx, 24000, 1);
            
            const sourceNode = ctx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(ctx.destination);
            sourceNode.addEventListener('ended', () => sourcesRef.current.delete(sourceNode));
            sourceNode.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(sourceNode);
          }

          if (message.serverContent?.interrupted) {
             for (const s of sourcesRef.current.values()) {
               try { s.stop(); } catch(e) {}
               sourcesRef.current.delete(s);
             }
             nextStartTimeRef.current = 0;
          }
        },
        (err) => {
          setStatus("Error occurred");
          setIsConnected(false);
        },
        () => {
          setStatus("Disconnected");
          setIsConnected(false);
        },
        selectedVoice
      );
    } catch (e) {
      setStatus("Connection Failed");
    }
  };

  const endSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => { try { session.close(); } catch(e) {} });
      sessionPromiseRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    setIsConnected(false);
    setStatus("Ready");
    setVolume(0);
  };

  // Visualizer Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: {x: number, y: number, r: number, vx: number, vy: number}[] = [];
    for(let i=0; i<30; i++) particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 100 + volume * 2;

      // Glow Effect
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing Core
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting Ring
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
      ctx.beginPath();
      const orbitOffset = Date.now() / 1000;
      ctx.arc(centerX, centerY, baseRadius + 40, orbitOffset, orbitOffset + Math.PI * 1.5);
      ctx.stroke();

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [volume]);

  return (
    <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-emerald-950/20"></div>
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link to="/dashboard" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400 mb-1">CrocSthepen AI</span>
          <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase">Voice Studio</div>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-12">
           <h2 className="text-sm font-black uppercase tracking-[0.5em] text-gray-400 animate-pulse">{status}</h2>
        </div>

        {!isConnected ? (
          <button 
            onClick={startSession}
            className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 transition-transform active:scale-95 group"
          >
            <i className="fa-solid fa-microphone text-3xl group-hover:animate-bounce"></i>
          </button>
        ) : (
          <button 
            onClick={endSession}
            className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 hover:scale-110 transition-transform active:scale-95 group"
          >
            <i className="fa-solid fa-phone-slash text-3xl group-hover:animate-pulse"></i>
          </button>
        )}
      </main>

      <aside className="absolute bottom-12 left-0 right-0 px-6 z-10 flex flex-col items-center">
        <div className="max-w-xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Persona Profile</span>
              <div className="flex space-x-2">
                 <button onClick={() => setNoiseReduction(!noiseReduction)} className={`p-2 rounded-xl border transition-all ${noiseReduction ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    <i className="fa-solid fa-wave-square"></i>
                 </button>
              </div>
           </div>

           <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {VOICES.map(v => (
                <button 
                  key={v.name}
                  onClick={() => setSelectedVoice(v.name)}
                  className={`px-6 py-4 rounded-2xl border transition-all shrink-0 text-left ${selectedVoice === v.name ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-600/20' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                >
                   <p className="text-xs font-black uppercase tracking-widest mb-1">{v.name}</p>
                   <p className="text-[10px] font-medium opacity-60">{v.description}</p>
                </button>
              ))}
           </div>
        </div>
      </aside>
    </div>
  );
};

export default LivePage;