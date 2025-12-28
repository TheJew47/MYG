"use client";
import { useState, useRef, useEffect } from "react";
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  CpuChipIcon, 
  PlusIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import EngineSetupModal from "@/components/modals/EngineSetupModal";

// Constants for backend communication
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/backend-api/api' 
  : "http://localhost:8000/api";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoadingVideo?: boolean;
  status?: string;
  statusText?: string;
  aspectRatio?: string;
  videoUrl?: string;
}

export default function CreatePage() {
  const [input, setInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(56, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * POLL TASK STATUS
   * Checks the backend every 3 seconds to update progress bars and final video.
   */
  const pollTaskStatus = async (taskId: string, messageId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
        if (!response.ok) throw new Error("Task fetch failed");
        
        const data = await response.json(); //

        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { 
                ...m, 
                status: `${data.progress}%`, 
                statusText: data.status 
              } 
            : m
        ));

        // When the task is "Completed", stop polling and show the video
        if (data.status === "Completed") {
          clearInterval(interval);
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { 
                  ...m, 
                  videoUrl: data.video_url, // This will be the S3 signed URL
                  isLoadingVideo: false,
                  status: "100%" 
                } 
              : m
          ));
          setIsGenerating(false); // Unlock the input bar
        }

        // Handle failure
        if (data.status.toLowerCase().includes("error")) {
          clearInterval(interval);
          setIsGenerating(false);
          alert("Generation failed: " + data.status);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
      }
    }, 3000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;
    setIsModalOpen(true);
  };

  /**
   * LAUNCH PRODUCTION
   * Triggered by the Modal after the user clicks "Proceed" and the POST request succeeds.
   */
  const handleLaunchProduction = (config: any) => {
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    
    setIsGenerating(true);
    setIsModalOpen(false);

    // 1. Add User Prompt Message
    setMessages(prev => [...prev, { 
      id: userMsgId, 
      role: 'user', 
      content: config.title 
    }]);

    setInput("");

    // 2. Add Assistant Loading Video Box
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: "",
      isLoadingVideo: true,
      status: "0%",
      statusText: "Queuing Task...",
      aspectRatio: config.aspectRatio
    }]);

    // 3. Start Polling the backend Task ID
    if (config.taskId) {
      pollTaskStatus(config.taskId, assistantMsgId);
    }
  };

  const getVideoMaxWidth = (ratio?: string) => {
    if (ratio === "9:16") return "max-w-[380px]";
    if (ratio === "1:1") return "max-w-[590px]";
    return "max-w-[800px]";
  };

  const getAspectRatioClass = (ratio?: string) => {
    if (ratio === "16:9") return "aspect-video";
    if (ratio === "9:16") return "aspect-[9/16]";
    return "aspect-square";
  };

  return (
    <>
      <div className="h-full w-full bg-app-bg text-white flex flex-col relative overflow-hidden">
        
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto pt-10 pb-32 px-4 md:px-12 space-y-10 custom-scrollbar relative z-10" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                <div className={`flex items-stretch gap-5 ${
                  msg.isLoadingVideo || msg.videoUrl ? 'w-full max-w-[95%]' : 'max-w-[85%] md:max-w-[75%]'
                } ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Circle Icons */}
                  <div className={`w-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                    msg.role === 'user' ? 'bg-app-input border-app-border text-text-muted' : 'bg-text-accent/10 border-text-accent/30 text-text-accent shadow-glow self-start h-10'
                  }`}>
                    {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <CpuChipIcon className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col gap-4 flex-1">
                    {/* Message Bubble */}
                    {!msg.isLoadingVideo && !msg.videoUrl && (
                      <div className="px-5 py-2.5 rounded-editor text-[13px] text-text-muted bg-app-card border border-app-border leading-relaxed h-full flex items-center">
                        {msg.content}
                      </div>
                    )}

                    {/* Rendering State */}
                    {msg.isLoadingVideo && (
                      <div className={`w-full ${getVideoMaxWidth(msg.aspectRatio)} ${getAspectRatioClass(msg.aspectRatio)} bg-app-card border border-app-border rounded-editor flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-premium`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-text-accent/5 to-transparent animate-pulse" />
                        
                        <div className="relative flex flex-col items-center gap-3">
                          <ArrowPathIcon className="w-12 h-12 text-text-accent animate-spin stroke-[1.5]" />
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white tracking-tighter">{msg.status}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium animate-[pulse_2s_infinite] brightness-150">
                              {msg.statusText || "Rendering Video"}
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                          <div 
                            className="h-full bg-text-accent shadow-glow transition-all duration-500" 
                            style={{ width: msg.status || '2%' }} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Final Video Player */}
                    {msg.videoUrl && (
                      <div className={`w-full ${getVideoMaxWidth(msg.aspectRatio)} ${getAspectRatioClass(msg.aspectRatio)} bg-black rounded-editor overflow-hidden shadow-premium border border-white/5`}>
                        <video 
                          src={msg.videoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                          poster="/video-placeholder.png"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={`relative z-30 flex items-center justify-center px-8 transition-all duration-500 ${messages.length === 0 ? 'flex-1' : 'pb-12'}`}>
          <div className={`w-full max-w-4xl flex items-center gap-5 transition-opacity duration-300 ${isGenerating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            <button disabled={isGenerating} className="p-2 text-white/30 hover:text-white/60 transition-all shrink-0 bg-transparent">
              <PlusIcon className="w-7 h-7 stroke-[2]" />
            </button>

            <div className="relative flex-1 group flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={isGenerating}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={isGenerating ? "Processing AI Pipeline..." : "Describe your cinematic idea..."}
                className="w-full bg-app-card border border-app-border rounded-editor min-h-[56px] py-[15px] pl-6 pr-14 text-[13px] text-white focus:border-text-accent/50 shadow-premium outline-none transition-all resize-none max-h-[200px] placeholder:text-text-muted/30"
              />
              
              <button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isGenerating} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-editor transition-all duration-300 transform
                  ${!input.trim() || isGenerating
                    ? 'bg-white/10 text-white/20 cursor-not-allowed' 
                    : 'bg-white text-black scale-110 hover:bg-text-accent hover:text-white shadow-glow'
                  }`}
              >
                <PaperAirplaneIcon className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <EngineSetupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchProduction}
        initialTitle={input}
        initialPrompt=""
      />
    </>
  );

}
