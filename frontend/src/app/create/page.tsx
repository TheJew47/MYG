"use client";
import { useState, useRef, useEffect } from "react";
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  CpuChipIcon,
  VideoCameraIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  Square3Stack3DIcon // Added for Workflows button
} from "@heroicons/react/24/outline";
import { api, endpoints } from "@/lib/api";
import WorkflowsModal from "@/components/modals/WorkflowsModal"; // Import the Workflows modal

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  videoUrl?: string; 
}

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'video' | 'image'>('video');
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false); // State for modal
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to the Creative Engine. I'm your AI production assistant. \n\nYou can generate ultra-fast FLUX images or high-fidelity LTX videos. What are we creating today?"
    }
  ]);

  // Adjust height based on content while respecting the base height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(56, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const downloadMedia = async (url: string, type: 'image' | 'video') => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = type === 'image' ? 'png' : 'mp4';
      link.download = `myg-creative-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      if (mode === 'image') {
        const response = await api.post(endpoints.generateImage, { prompt: currentInput });
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Successfully generated image from your prompt:",
          imageUrl: response.data.url
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const response = await api.post(endpoints.generateVideo, { prompt: currentInput });
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Cinematic sequence generation complete:",
          videoUrl: response.data.url
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Generation failed. The engine might be under high load or warming up. Please try again in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full w-full bg-app-bg text-white flex flex-col relative">
      {/* Dynamic Header */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md border-b border-app-border z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-text-accent/10 rounded-md">
            <SparklesIcon className="w-5 h-5 text-text-accent" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Creative Engine</h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Model:</span>
           <span className="px-2 py-0.5 bg-app-input border border-app-border rounded text-[10px] text-text-accent font-bold uppercase">
             {mode === 'video' ? 'LTX-Video v0.9' : 'FLUX.1-Schnell'}
           </span>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 md:px-12 space-y-10 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-editor flex items-center justify-center flex-shrink-0 border transition-colors ${
                msg.role === 'user' ? 'bg-app-input border-app-border text-text-muted' : 'bg-text-accent/10 border-text-accent/30 text-text-accent shadow-glow'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <CpuChipIcon className="w-4 h-4" />}
              </div>
              
              <div className={`flex flex-col gap-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-4 rounded-editor text-[13px] leading-relaxed tracking-tight whitespace-pre-wrap transition-premium ${
                  msg.role === 'user' ? 'bg-app-hover border border-white/5 text-white' : 'bg-app-card border border-app-border text-text-muted'
                }`}>
                  {msg.content}
                </div>
                
                {/* Generated Assets Display */}
                {(msg.imageUrl || msg.videoUrl) && (
                  <div className="relative group rounded-editor overflow-hidden border border-app-border shadow-premium bg-black max-w-lg w-full">
                    {msg.imageUrl && (
                      <img 
                         src={msg.imageUrl} 
                         alt="AI Gen" 
                         className="w-full h-auto object-cover transition-opacity duration-300 group-hover:opacity-90" 
                      />
                    )}
                    {msg.videoUrl && (
                      <video 
                         src={msg.videoUrl} 
                         controls
                         className="w-full h-auto" 
                      />
                    )}
                    
                    {/* Floating Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button 
                          onClick={() => downloadMedia(msg.imageUrl || msg.videoUrl!, msg.imageUrl ? 'image' : 'video')}
                          className="px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-editor text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                          Download
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start w-full ml-14">
             <div className="flex items-center gap-1.5 bg-app-card border border-app-border px-4 py-2.5 rounded-editor shadow-premium">
               <div className="w-1.5 h-1.5 bg-text-accent rounded-full animate-pulse" />
               <div className="w-1.5 h-1.5 bg-text-accent/60 rounded-full animate-pulse delay-75" />
               <div className="w-1.5 h-1.5 bg-text-accent/30 rounded-full animate-pulse delay-150" />
             </div>
          </div>
        )}
      </div>

      {/* Input Field Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-end gap-3 pointer-events-auto">
          {/* Mode Selector */}
          <button
            onClick={() => setMode(mode === 'video' ? 'image' : 'video')}
            className={`h-14 w-14 rounded-editor border flex items-center justify-center transition-premium shrink-0 shadow-premium ${
              mode === 'video' ? 'bg-app-card border-text-accent/30 text-text-accent' : 'bg-app-card border-green-500/30 text-green-500'
            }`}
            title={`Switch to ${mode === 'video' ? 'Image' : 'Video'} generation`}
          >
            {mode === 'video' ? <VideoCameraIcon className="w-6 h-6" /> : <PhotoIcon className="w-6 h-6" />}
          </button>

          {/* WORKFLOWS BUTTON - Placed right next to switcher */}
          <button
            onClick={() => setIsWorkflowsOpen(true)}
            className="h-14 px-5 bg-app-card border border-app-border rounded-editor flex items-center justify-center gap-2.5 text-text-muted hover:text-white hover:border-text-accent/30 transition-premium shrink-0 shadow-premium group"
          >
            <Square3Stack3DIcon className="w-5 h-5 group-hover:text-text-accent transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Workflows</span>
          </button>

          {/* Main Text Input */}
          <div className="relative flex-1 group">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe your cinematic ${mode} idea...`}
              className="w-full bg-app-card border border-app-border rounded-editor min-h-[56px] py-[15px] pl-6 pr-14 text-[13px] text-white focus:border-text-accent/50 focus:bg-app-input shadow-premium outline-none transition-all resize-none max-h-[200px] placeholder:text-text-muted/30 flex items-center"
            />
            <button 
              onClick={() => handleSubmit()} 
              disabled={!input.trim() || isTyping} 
              className="absolute right-3 bottom-3 p-2 bg-white text-black rounded-editor disabled:opacity-20 hover:bg-text-accent hover:text-white transition-all shadow-glow"
            >
              <PaperAirplaneIcon className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
        
        {/* Footnote Tip */}
        <div className="text-center mt-4 opacity-30">
           <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Press Enter to generate • Shift + Enter for new line</p>
        </div>
      </div>

      {/* Workflows Modal Component */}
      <WorkflowsModal 
        isOpen={isWorkflowsOpen} 
        onDismiss={() => setIsWorkflowsOpen(false)} 
      />
    </div>
  );
}