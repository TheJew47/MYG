"use client";
import { api, uploadApi, endpoints } from "@/lib/api";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  PlayIcon, PauseIcon, StopIcon, 
  VideoCameraIcon, MusicalNoteIcon, 
  ChatBubbleBottomCenterTextIcon, ArrowDownTrayIcon, 
  ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon,
  PlusIcon, ScissorsIcon, TrashIcon,
  ArrowPathIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
  EyeIcon, EyeSlashIcon, EllipsisVerticalIcon,
  MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon,
  CursorArrowRippleIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon,
  CloudArrowUpIcon, FolderIcon, PhotoIcon 
} from "@heroicons/react/24/outline";
import { Reorder, AnimatePresence, motion } from "framer-motion";

// --- RESOLUTIONS ---
const RESOLUTIONS = {
  "9:16": { w: 1080, h: 1920, label: "TikTok (9:16)" },
  "16:9": { w: 1920, h: 1080, label: "YouTube (16:9)" },
  "1:1":  { w: 1080, h: 1080, label: "Square (1:1)" },
};

// --- TYPES ---
type TrackType = "video" | "image" | "text" | "audio";

interface ClipProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  color?: string;
  fontSize?: number;
  volume?: number;
}

interface Clip {
  id: string;
  type: TrackType;
  src?: string;
  renderSrc?: string;
  content?: string;
  start: number;
  duration: number;
  layer: number;
  properties: ClipProperties;
}

interface Track {
  id: number;
  type: TrackType;
  label: string;
  clips: Clip[];
  isHidden: boolean;
  isMuted: boolean;
}

interface Asset {
    id: string;
    type: 'image' | 'video' | 'audio';
    src: string;
    thumb: string;
    renderSrc?: string;
}

// --- SUB-COMPONENT: STAGE CLIP (FIXES VIDEO PLAYBACK) ---
const StageClip = ({ clip, currentTime, isPlaying, isSelected, onSelect, onContextMenu, onTransform, setEditingTextId }: { 
    clip: Clip, 
    currentTime: number, 
    isPlaying: boolean, 
    isSelected: boolean,
    onSelect: (e: React.MouseEvent) => void,
    onContextMenu: (e: React.MouseEvent) => void,
    onTransform: (e: React.MouseEvent, type: 'move'|'resize', handle?: string) => void,
    setEditingTextId: (id: string | null) => void
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isEditingText, setIsEditingText] = useState(false);

    // Efficient Video Sync
    useEffect(() => {
        if (clip.type === 'video' && videoRef.current) {
            const vid = videoRef.current;
            const offset = currentTime - clip.start;
            
            // 1. Sync Time: Only seek if drift is noticeable (>0.2s) to prevent stutter
            if (Math.abs(vid.currentTime - offset) > 0.2) {
                vid.currentTime = offset;
            }

            // 2. Sync Play State: Play if global is playing and we are within clip bounds
            if (isPlaying && offset >= 0 && offset < clip.duration) {
                if (vid.paused) vid.play().catch(() => {});
            } else {
                if (!vid.paused) vid.pause();
            }
        }
    }, [currentTime, isPlaying, clip.start, clip.duration, clip.type]);

    const clipProps = clip.properties;

    return (
        <div 
            className="absolute" 
            style={{ 
                left: `${clipProps.x}%`, 
                top: `${clipProps.y}%`, 
                width: `${clipProps.width}%`, 
                height: `${clipProps.height}%`, 
                transform: `translate(-50%, -50%) rotate(${clipProps.rotation}deg)`, 
                opacity: clipProps.opacity, 
                zIndex: isSelected ? 100 : 10 
            }}
            onMouseDown={onSelect}
            onDoubleClick={(e) => { e.stopPropagation(); if (clip.type === 'text') setIsEditingText(true); }}
            onContextMenu={onContextMenu}
        >
            {clip.type === 'video' ? (
                <div className="w-full h-full relative pointer-events-none">
                    <video 
                        ref={videoRef}
                        src={clip.src} 
                        className="w-full h-full object-fill select-none"
                        muted // Muted in stage to prevent echo (Audio track handles sound usually)
                        playsInline
                        preload="auto"
                    />
                </div>
            ) : clip.type === 'text' ? (
                <div 
                    contentEditable={isEditingText}
                    suppressContentEditableWarning
                    className={`w-full h-full flex items-center justify-center outline-none text-center leading-none whitespace-pre-wrap break-words ${isEditingText ? 'cursor-text caret-white pointer-events-auto' : 'select-none pointer-events-none'}`}
                    style={{ color: clip.properties.color, fontSize: `${clip.properties.fontSize}px`, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }} 
                    onKeyDown={(e) => { if(isEditingText) e.stopPropagation(); }}
                    onBlur={(e) => { setIsEditingText(false); setEditingTextId(null); /* In a real app, you'd callback to save text here */ }}
                >
                    {clip.content}
                </div>
            ) : (
                <img src={clip.src} className="w-full h-full object-fill pointer-events-none select-none"/>
            )}
            
            {isSelected && (
                <>
                    {['nw','ne','sw','se','n','e','s','w'].map(h => (
                        <div key={h} className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-50 ${h.includes('n')?'-top-1.5':h.includes('s')?'-bottom-1.5':'top-1/2 -translate-y-1/2'} ${h.includes('w')?'-left-1.5':h.includes('e')?'-right-1.5':'left-1/2 -translate-x-1/2'} cursor-${h}-resize`} 
                            onMouseDown={(e) => onTransform(e, 'resize', h)} 
                        />
                    ))}
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
                    <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"/>
                </>
            )}
        </div>
    );
};

// --- INITIAL STATE ---
const INITIAL_TRACKS: Track[] = [
  { id: 102, type: "video", label: "Base Video", isHidden: false, isMuted: false, clips: [] },
  { id: 101, type: "image", label: "Sprites", isHidden: false, isMuted: false, clips: [] },
  { id: 100, type: "text", label: "Text Layer", isHidden: false, isMuted: false, clips: [] },
];

export default function EditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- CONFIG FROM URL ---
  const fpsParam = parseInt(searchParams.get('fps') || "24");
  const resParam = (searchParams.get('res') || "16:9") as keyof typeof RESOLUTIONS;
  const durParam = parseInt(searchParams.get('dur') || "15");

  // Constants based on configuration
  const FPS = fpsParam;
  const FRAME_DURATION = 1 / FPS;

  // --- UTILS ---
  const snapTime = useCallback((t: number) => Math.round(t * FPS) / FPS, [FPS]);

  // Deterministic waveform generator
  const generateWaveform = (id: string, color: string) => {
    let seed = 0;
    for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i);
    const pseudoRandom = (x: number) => {
        const n = Math.sin(x) * 10000;
        return n - Math.floor(n);
    };
    let d = "";
    for (let i = 0; i < 100; i += 2) {
        const h = 20 + pseudoRandom(seed + i) * 60; 
        d += `M${i} 50 L${i} ${50 - h/2} M${i} 50 L${i} ${50 + h/2} `; 
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}' stroke='${color}' stroke-width='1.5' stroke-opacity='0.7' vector-effect='non-scaling-stroke'/></svg>`;
    return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
  };

  // --- HISTORY STATE ---
  const [history, setHistory] = useState<Track[][]>([INITIAL_TRACKS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);

  const updateTracks = (newTracks: Track[] | ((prev: Track[]) => Track[]), isHistoryAction = false) => {
    setTracks(prev => {
      const updated = typeof newTracks === 'function' ? newTracks(prev) : newTracks;
      if (!isHistoryAction && updated !== prev) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      return updated;
    });
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setTracks(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setTracks(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // --- MAIN STATE ---
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(durParam); 
  
  const currentRes = RESOLUTIONS[resParam] || RESOLUTIONS["16:9"];

  // --- UI STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [zoom, setZoom] = useState(20); 
  const [minZoom, setMinZoom] = useState(10); 
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [editingTextId, setEditingTextId] = useState<string | null>(null); 
  const [addTrackMenuOpen, setAddTrackMenuOpen] = useState(false);
  const [editingTrackName, setEditingTrackName] = useState<number | null>(null); 
  const [draggedTrackId, setDraggedTrackId] = useState<number | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, clipId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "text" | "uploads">("media");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaAssets, setMediaAssets] = useState<Asset[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [page, setPage] = useState(1);

  // Layout
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [inspectorWidth, setInspectorWidth] = useState(320); 
  const [timelineHeight, setTimelineHeight] = useState(300); 
  const [resizingPanel, setResizingPanel] = useState<'sidebar'|'inspector'|'timeline'|null>(null);
  const [stageScale, setStageScale] = useState(1); 
  const [stagePan, setStagePan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null); 
  const tracksContainerRef = useRef<HTMLDivElement>(null); 
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Interaction
  const [transforming, setTransforming] = useState<{ id: string, type: 'move'|'resize', handle?: string, startX: number, startY: number, startProps: ClipProperties, aspectRatio?: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{ id: string, type: 'move'|'trim', startX: number, originalStart: number, originalDuration: number } | null>(null);

  // Computed
  const selectedClip = useMemo(() => tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId), [selectedClipId, tracks]);
  
  const activeVideoClip = useMemo(() => {
    const vidTracks = tracks.filter(t => t.type === 'video' && !t.isHidden);
    const baseTrack = vidTracks[vidTracks.length - 1]; 
    return baseTrack?.clips.find(c => currentTime >= c.start && currentTime < (c.start + c.duration));
  }, [tracks, currentTime]);

  // --- SCRUB & SCROLL LOGIC ---
  const handleScrub = useCallback((e: React.MouseEvent | MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const t = Math.max(0, Math.min(duration, x / zoom));
      setCurrentTime(snapTime(t));
  }, [duration, zoom, snapTime]);

  // --- COLLISION LOGIC ---
  // Helper: Pure function to check collision on a specific track's clips
  const checkCollisionOnClips = (clips: Clip[], clipId: string, newStart: number, newDuration: number) => {
    const newEnd = newStart + newDuration;
    for (const clip of clips) {
        if (clip.id === clipId) continue;
        const clipEnd = clip.start + clip.duration;
        // Collision logic: (StartA < EndB) and (EndA > StartB)
        if (newStart < clipEnd && newEnd > clip.start) {
            return true; 
        }
    }
    return false;
  };

  const checkCollision = (track: Track, clipId: string, newStart: number, newDuration: number) => {
    return checkCollisionOnClips(track.clips, clipId, newStart, newDuration);
  };

  // --- AUTO SCALE LOGIC ---
  useEffect(() => {
      const updateScale = () => {
          if (stageContainerRef.current) {
              const { clientWidth, clientHeight } = stageContainerRef.current;
              const xRatio = (clientWidth - 40) / currentRes.w;
              const yRatio = (clientHeight - 40) / currentRes.h;
              setFitScale(Math.min(xRatio, yRatio, 1));
          }
      };
      
      window.addEventListener('resize', updateScale);
      const observer = new ResizeObserver(updateScale);
      if (stageContainerRef.current) observer.observe(stageContainerRef.current);
      updateScale(); 
      return () => { window.removeEventListener('resize', updateScale); observer.disconnect(); };
  }, [currentRes, sidebarWidth, inspectorWidth, timelineHeight]);

  // --- TIMELINE ZOOM LOGIC ---
  useEffect(() => {
    if (!timelineRef.current) return;
    const updateMinZoom = () => {
        if (timelineRef.current) {
            const width = timelineRef.current.clientWidth - 200; 
            const calculatedMin = width / (duration * 1.05); 
            setMinZoom(calculatedMin);
            if (zoom < calculatedMin) setZoom(calculatedMin);
        }
    };
    const observer = new ResizeObserver(updateMinZoom);
    observer.observe(timelineRef.current);
    updateMinZoom();
    return () => observer.disconnect();
  }, [duration, isSidebarOpen, isInspectorCollapsed, sidebarWidth, inspectorWidth, zoom]);

  // --- API FUNCTIONS ---
  const fetchAssets = async (pageNum: number, query: string, append = false) => {
      setLoadingAssets(true);
      try {
          const q = query.trim() || "backgrounds";
          const res = await api.get('/api/assets/search', { params: { q, page: pageNum } });
          const assets = res.data.map((item: any) => ({
             id: item.id, type: 'image', src: item.src, thumb: item.thumb
          }));
          
          if (append) setMediaAssets(prev => [...prev, ...assets]);
          else setMediaAssets(assets);
      } catch (err) { console.error(err); } 
      finally { setLoadingAssets(false); }
  };

  useEffect(() => {
    if (activeTab === 'media' && mediaAssets.length === 0) fetchAssets(1, "");
  }, [activeTab]);

  const handleSearch = () => {
    setPage(1);
    fetchAssets(1, searchQuery, false);
  };

  const loadMoreAssets = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAssets(nextPage, searchQuery, true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
          const res = await uploadApi.post(endpoints.uploadFile, formData);
          const type = file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'image';
          const newAsset: Asset = {
              id: Math.random().toString(36),
              type: type as 'video'|'image'|'audio', 
              src: URL.createObjectURL(file), 
              thumb: URL.createObjectURL(file), 
              renderSrc: res.data.path 
          };
          setUploadedAssets(prev => [newAsset, ...prev]);
      } catch (err) { alert("Upload failed"); }
  };

  // --- ACTIONS ---
  const addTrack = (type: TrackType) => {
    const newId = Math.max(0, ...tracks.map(t => t.id)) + 1;
    updateTracks([{ id: newId, type, label: `New ${type} Layer`, isHidden: false, isMuted: false, clips: [] }, ...tracks]);
    setAddTrackMenuOpen(false);
  };

  // --- SMART ADD LOGIC (FIXED FOR VIDEO) ---
  const addClipToTrack = (trackId: number, content?: string, src?: string, type?: TrackType, renderSrc?: string) => {
    // 1. Determine clip type reliably
    let clipType = type;
    if (!clipType) {
        // Fallback: if not provided, infer from the trackId passed, or default to video
        const t = tracks.find(tr => tr.id === trackId);
        clipType = t ? t.type : 'video';
    }

    const start = snapTime(currentTime);

    // This internal helper handles creating the object and updating state
    const finalizeAdd = (w: number, h: number, d: number) => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newClip: Clip = {
            id: newId, 
            type: clipType!, 
            src, 
            renderSrc: renderSrc || src,
            content: content || (clipType === 'text' ? "New Text" : undefined),
            start: start, 
            duration: d, 
            layer: 0,
            properties: { x: 50, y: 50, width: w, height: h, opacity: 1, rotation: 0, color: '#FFFFFF', fontSize: 60, volume: 1.0 }
        };

        updateTracks(prev => {
            const stateTracks = [...prev];
            
            // 2. SMART PLACEMENT ALGORITHM:
            // Find ALL tracks that match the clip's type
            const compatibleTracks = stateTracks.filter(t => t.type === clipType);
            
            // 3. Iterate through them to find the FIRST one with empty space at this time
            let targetTrack = compatibleTracks.find(t => !checkCollisionOnClips(t.clips, newId, start, d));

            // 4. If NO compatible track has space, create a NEW track
            if (!targetTrack) {
                const newTrackId = Math.max(0, ...stateTracks.map(t => t.id)) + 1;
                targetTrack = { 
                    id: newTrackId, 
                    type: clipType!, 
                    label: `${clipType} Layer`, 
                    isHidden: false, 
                    isMuted: false, 
                    clips: [] 
                };
                // Add new track to the top of the list so it's visible
                stateTracks.unshift(targetTrack);
            }

            // 5. Add the clip to the chosen track
            targetTrack.clips.push(newClip);
            return stateTracks;
        });
        setSelectedClipId(newId);
    };

    if (clipType === 'video' && src) {
        const vid = document.createElement('video');
        vid.preload = "metadata";
        vid.onloadedmetadata = () => {
             // FIX: Robust Duration Check: some blob URLs return Infinity initially
             let naturalDur = vid.duration;
             if (!Number.isFinite(naturalDur) || naturalDur <= 0) naturalDur = 10;
             const constrainedDur = naturalDur; // Allow full length
             
             let w = 100, h = 100; 
             if (stageRef.current) {
                const stageRect = stageRef.current.getBoundingClientRect();
                const stageAspect = stageRect.width / stageRect.height;
                const vidAspect = vid.videoWidth / vid.videoHeight || 1.77;
                if (vidAspect > stageAspect) { w = 100; h = (100 / vidAspect) * stageAspect; } 
                else { h = 100; w = (100 * vidAspect) / stageAspect; }
             }
             finalizeAdd(w, h, constrainedDur);
        };
        vid.onerror = () => finalizeAdd(100, 56.25, 5);
        vid.src = src;
    } 
    else if (clipType === 'image' && src) {
        const img = new Image();
        img.onload = () => {
            let w = 50, h = 50; 
            if (stageRef.current) {
                const stageRect = stageRef.current.getBoundingClientRect();
                const stageAspect = stageRect.width / stageRect.height;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                if (imgAspect > stageAspect) { w = 50; h = (w / imgAspect) * stageAspect; } 
                else { h = 50; w = (h * imgAspect) / stageAspect; }
            }
            finalizeAdd(w, h, 3);
        };
        img.onerror = () => finalizeAdd(50, 50, 3);
        img.src = src;
    } else if (clipType === 'audio' && src) {
        const aud = document.createElement('audio');
        aud.onloadedmetadata = () => finalizeAdd(0, 0, Math.min(aud.duration || 10, duration));
        aud.onerror = () => finalizeAdd(0, 0, 10);
        aud.src = src;
    } else {
        finalizeAdd(clipType === 'text' ? 50 : 30, clipType === 'text' ? 10 : 30, 3);
    }
  };

  const updateClipProperty = (updates: Partial<ClipProperties> & { content?: string }) => {
    if (!selectedClip) return;
    const { content, ...props } = updates;
    updateTracks(prev => prev.map(t => ({
        ...t,
        clips: t.clips.map(c => {
            if (c.id !== selectedClipId) return c;
            return { 
                ...c, 
                ...(content !== undefined ? { content } : {}),
                properties: { ...c.properties, ...props } 
            };
        })
    })));
  };

  const deleteClip = (id: string) => {
     updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== id) })));
     if (selectedClipId === id) setSelectedClipId(null);
  };

  const moveClipLayer = (id: string, direction: 'up' | 'down') => {
      const trackIdx = tracks.findIndex(t => t.clips.some(c => c.id === id));
      if (trackIdx === -1) return;
      
      const targetTrackIdx = direction === 'up' ? trackIdx - 1 : trackIdx + 1;
      if (targetTrackIdx < 0 || targetTrackIdx >= tracks.length) return;
      
      const sourceTrack = tracks[trackIdx];
      const targetTrack = tracks[targetTrackIdx];

      // Strict Type Check
      if (sourceTrack.type !== targetTrack.type) {
          alert(`Cannot move ${sourceTrack.type} clip to ${targetTrack.type} layer.`);
          return;
      }

      const clip = sourceTrack.clips.find(c => c.id === id);
      if (!clip) return;

      if (checkCollision(targetTrack, clip.id, clip.start, clip.duration)) {
          alert("Target layer has a collision at this time.");
          return;
      }

      updateTracks(prev => {
          const newTracks = [...prev];
          newTracks[trackIdx] = { 
              ...newTracks[trackIdx], 
              clips: newTracks[trackIdx].clips.filter(c => c.id !== id) 
          };
          newTracks[targetTrackIdx] = { 
              ...newTracks[targetTrackIdx], 
              clips: [...newTracks[targetTrackIdx].clips, clip] 
          };
          return newTracks;
      });
      setContextMenu(null);
  };

  const resetProperty = useCallback((prop: 'opacity' | 'rotation' | 'volume') => {
      if (!selectedClipId) return;
      const defaults = { opacity: 1, rotation: 0, volume: 1.0 };
      updateTracks(prev => prev.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === selectedClipId ? { ...c, properties: { ...c.properties, [prop]: defaults[prop] } } : c)
      })));
  }, [selectedClipId]);

  const toggleTrackProp = (id: number, prop: 'isHidden' | 'isMuted') => {
    updateTracks(prev => prev.map(t => t.id === id ? { ...t, [prop]: !t[prop] } : t));
  };

  const updateClipDuration = (newStart?: number, newEnd?: number) => {
    if(!selectedClip) return;
    const track = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
    if (!track) return;
    const potentialStart = newStart !== undefined ? snapTime(newStart) : selectedClip.start;
    const potentialEnd = newEnd !== undefined ? snapTime(newEnd) : selectedClip.start + selectedClip.duration;
    const potentialDur = Math.max(FRAME_DURATION, potentialEnd - potentialStart);
    if (checkCollision(track, selectedClip.id, potentialStart, potentialDur)) return;
    updateTracks(prev => prev.map(t => ({
        ...t, 
        clips: t.clips.map(c => { if (c.id !== selectedClipId) return c; return { ...c, start: potentialStart, duration: potentialDur }; })
    })));
  };

  // --- HELPER: TRACK ICON ---
  const getTrackIcon = (type: TrackType) => {
      switch (type) {
          case 'video': return <VideoCameraIcon className="w-4 h-4 text-blue-400 mr-2" />;
          case 'audio': return <MusicalNoteIcon className="w-4 h-4 text-pink-400 mr-2" />;
          case 'image': return <PhotoIcon className="w-4 h-4 text-green-400 mr-2" />;
          case 'text': return <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-purple-400 mr-2" />;
          default: return null;
      }
  };

  // --- RENDER RULER ---
  const renderRuler = () => {
    const marks = [];
    const totalSeconds = Math.ceil(duration);
    for (let i = 0; i <= totalSeconds; i++) {
      marks.push(<div key={i} className="absolute top-0 bottom-0 border-l border-gray-600 pl-1 text-[9px] text-gray-400 font-mono select-none" style={{ left: i * zoom }}>{i}s</div>);
      if (zoom > 50) {
        const step = 1 / FPS;
        for (let f = 1; f < FPS; f++) {
           if (zoom < 150 && f % 6 !== 0) continue;
           marks.push(<div key={`${i}-${f}`} className="absolute bottom-0 h-1.5 border-l border-gray-700" style={{ left: (i + f * step) * zoom }} />);
        }
      }
    }
    return marks;
  };

  // --- EXPORT & POLLING ---
  const checkTaskStatus = async (taskId: string) => {
      const interval = setInterval(async () => {
          try {
              const res = await api.get(`/api/tasks/${taskId}`);
              if (res.data.status === 'Completed') {
                  clearInterval(interval);
                  setIsExporting(false);
                  if (res.data.video_url) {
                      const videoRes = await fetch(res.data.video_url);
                      const blob = await videoRes.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `video-${taskId}.mp4`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                  }
              } else if (res.data.status === 'Failed') {
                  clearInterval(interval);
                  setIsExporting(false);
                  alert("Export Failed.");
              }
          } catch (e) { console.error(e); }
      }, 3000); 
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const resString = `${currentRes.w}x${currentRes.h}`;
      const payload = {
        title: "NLE Render",
        project_id: parseInt(params.id),
        timeline: tracks,
        resolution: resString,
        fps: FPS, // Pass FPS to backend
        duration: duration 
      };
      const response = await api.post(endpoints.tasks.generate, payload);
      checkTaskStatus(response.data.task_id);
    } catch (error) {
      console.error(error);
      alert("Export failed.");
      setIsExporting(false);
    }
  };

  // --- DRAG/DROP & EVENTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!editingTextId && selectedClipId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            e.preventDefault(); deleteClip(selectedClipId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, editingTextId, undo, redo]);

  useEffect(() => {
    if (isPlaying) { lastTimeRef.current = performance.now(); animationRef.current = requestAnimationFrame(loop); }
    else if (animationRef.current) cancelAnimationFrame(animationRef.current);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying]);

  const loop = (timestamp: number) => {
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= duration) { if (isLooping) return 0; setIsPlaying(false); return duration; }
        return next;
    });
    animationRef.current = requestAnimationFrame(loop);
  };

  const handleStageMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1) { e.preventDefault(); setIsPanning(true); }
      else if (e.button === 0 && e.target === e.currentTarget) { setSelectedClipId(null); setContextMenu(null); }
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
      e.dataTransfer.setData("asset", JSON.stringify(asset));
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const assetData = e.dataTransfer.getData("asset");
      if (assetData) {
          const asset = JSON.parse(assetData);
          // Pass -1 to let Smart Logic find the best track, and pass the Type correctly
          addClipToTrack(-1, undefined, asset.src, asset.type, asset.renderSrc);
      }
  };

  // Main interaction handler
  useEffect(() => {
     const handleMove = (e: MouseEvent) => {
         if (resizingPanel === 'sidebar') setSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
         if (resizingPanel === 'inspector') setInspectorWidth(Math.max(250, Math.min(500, window.innerWidth - e.clientX)));
         if (resizingPanel === 'timeline') setTimelineHeight(Math.max(150, Math.min(600, window.innerHeight - e.clientY)));
         if (isPanning) setStagePan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
         
         if (scrubbing && timelineRef.current) {
             const rect = timelineRef.current.getBoundingClientRect();
             const scrollLeft = timelineRef.current.scrollLeft;
             
             // FIX: Removed unnecessary offset or boundary checks that cause sync issues
             const x = e.clientX - rect.left + scrollLeft;
             setCurrentTime(snapTime(Math.max(0, Math.min(duration, x / zoom))));
         }
         
         // --- UPDATED DRAGGING LOGIC ---
         if (draggingClip) {
             const delta = (e.clientX - draggingClip.startX) / zoom;

             // 1. Detect track under mouse
             const elem = document.elementFromPoint(e.clientX, e.clientY);
             const trackElem = elem?.closest('[data-track-id]');
             const targetTrackId = trackElem ? parseInt(trackElem.getAttribute('data-track-id')!) : null;

             updateTracks(prev => {
                const currentTrack = prev.find(t => t.clips.some(c => c.id === draggingClip.id));
                if (!currentTrack) return prev;
                
                const clip = currentTrack.clips.find(c => c.id === draggingClip.id)!;
                
                // Calculate proposed Time
                let newStart = clip.start;
                let newDur = clip.duration;
                if (draggingClip.type === 'move') {
                    newStart = snapTime(Math.max(0, Math.min(draggingClip.originalStart + delta, duration - clip.duration)));
                } else if (draggingClip.type === 'trim') {
                    newDur = snapTime(Math.max(FRAME_DURATION, Math.min(draggingClip.originalDuration + delta, duration - clip.start)));
                }

                // Determine if we should switch tracks
                let finalTrackId = currentTrack.id;
                
                if (targetTrackId !== null && targetTrackId !== currentTrack.id) {
                    const targetTrack = prev.find(t => t.id === targetTrackId);
                    // Check type compatibility
                    if (targetTrack && targetTrack.type === currentTrack.type) {
                        // Check collision on NEW track
                        const hasCollision = checkCollisionOnClips(targetTrack.clips, clip.id, newStart, newDur);
                        if (!hasCollision) {
                            finalTrackId = targetTrackId;
                        }
                    }
                }

                if (finalTrackId !== currentTrack.id) {
                    // Move between tracks
                    return prev.map(t => {
                        if (t.id === currentTrack.id) {
                            return { ...t, clips: t.clips.filter(c => c.id !== clip.id) };
                        }
                        if (t.id === finalTrackId) {
                            return { ...t, clips: [...t.clips, { ...clip, start: newStart, duration: newDur }] };
                        }
                        return t;
                    });
                } else {
                    // Stay on same track (check local collision)
                    const hasCollision = checkCollisionOnClips(currentTrack.clips, clip.id, newStart, newDur);
                    if (hasCollision) return prev;

                    return prev.map(t => {
                        if (t.id === currentTrack.id) {
                            return {
                                ...t,
                                clips: t.clips.map(c => c.id === clip.id ? { ...c, start: newStart, duration: newDur } : c)
                            };
                        }
                        return t;
                    });
                }
             });
         }

         if (transforming && stageRef.current) {
             const rect = stageRef.current.getBoundingClientRect();
             const dx = (e.clientX - transforming.startX) / rect.width * 100;
             const dy = (e.clientY - transforming.startY) / rect.height * 100;
             const { id, type, handle, startProps, aspectRatio } = transforming;
             updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => {
                 if (c.id !== id) return c;
                 const p = { ...startProps };
                 if (type === 'move') { p.x = startProps.x + dx; p.y = startProps.y + dy; }
                 else if (type === 'resize' && handle) {
                     let newW = p.width, newH = p.height;
                     if (handle.includes('e')) newW = Math.max(1, startProps.width + dx);
                     if (handle.includes('w')) newW = Math.max(1, startProps.width - dx);
                     if (handle.includes('s')) newH = Math.max(1, startProps.height + dy);
                     if (handle.includes('n')) newH = Math.max(1, startProps.height - dy);
                     if (handle.length === 2 && aspectRatio) { 
                         if (handle.includes('e') || handle.includes('w')) newH = newW / aspectRatio; 
                         else newW = newH * aspectRatio; 
                     }
                     if (handle.includes('w')) p.x = startProps.x + (startProps.width - newW) / 2;
                     if (handle.includes('e')) p.x = startProps.x + (newW - startProps.width) / 2;
                     if (handle.includes('n')) p.y = startProps.y + (startProps.height - newH) / 2;
                     if (handle.includes('s')) p.y = startProps.y + (newH - startProps.height) / 2;
                     p.width = newW; p.height = newH;
                 }
                 return { ...c, properties: p };
             })})), true);
         }
     };
     const handleUp = () => {
         if (draggingClip || transforming) {
             setTracks(prev => {
                 const h = history.slice(0, historyIndex + 1); h.push(prev);
                 if (h.length > 50) h.shift(); setHistory(h); setHistoryIndex(h.length - 1); return prev;
             });
         }
         setIsPanning(false); setScrubbing(false); setDraggingClip(null); setTransforming(null); setResizingPanel(null);
         setDraggedTrackId(null);
     };
     window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
     return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isPanning, scrubbing, draggingClip, transforming, zoom, duration, stageScale, resizingPanel, tracks, snapTime]);

  // --- CONTEXT MENU CLICK OUTSIDE ---
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0E14] text-white overflow-hidden font-sans selection:bg-blue-500/30" onContextMenu={(e) => e.preventDefault()}>
        {/* HEADER */}
        <div className="h-14 border-b border-app-border flex items-center justify-between px-4 bg-[#161B26] shrink-0 z-50">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()}><ChevronLeftIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                <h1 className="font-bold text-sm">Pro Editor</h1>
                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                {/* READ-ONLY Resolution Display */}
                <div className="bg-[#0B0E14] border border-gray-700 rounded px-3 py-1 text-xs text-gray-300 flex items-center gap-2 cursor-not-allowed opacity-80">
                   <span className="text-gray-500 font-bold uppercase">Res:</span>
                   {currentRes.label}
                   <span className="w-px h-3 bg-gray-700 mx-1"></span>
                   <span className="text-gray-500 font-bold uppercase">FPS:</span>
                   {FPS}
                </div>
            </div>
            
            <div className="flex gap-4 items-center">
                 {/* DURATION EDITOR */}
                 <div className="flex items-center gap-2 bg-[#0B0E14] border border-gray-700 rounded px-2 py-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Duration:</span>
                    <input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value)))}
                      className="w-12 bg-transparent text-xs text-white text-right outline-none"
                    />
                    <span className="text-xs text-gray-500">s</span>
                 </div>

                <div className="flex gap-2">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-700 rounded disabled:opacity-30"><ArrowPathIcon className="w-4 h-4 transform -scale-x-100"/></button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-700 rounded disabled:opacity-30"><ArrowPathIcon className="w-4 h-4"/></button>
                    <button onClick={handleExport} disabled={isExporting} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2">
                        {isExporting ? "Rendering..." : "Export"} {isExporting ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowDownTrayIcon className="w-4 h-4"/>}
                    </button>
                </div>
            </div>
        </div>

        {/* WORKSPACE (Mostly unchanged, wrapped in existing layout) */}
        <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR */}
            <div className="flex shrink-0 z-40 bg-[#161B26] border-r border-app-border h-full relative" style={{ width: isSidebarOpen ? sidebarWidth : 'auto' }}>
                <div className="w-16 flex flex-col items-center py-4 gap-6 border-r border-gray-800 shrink-0">
                    <button onClick={() => { setActiveTab("media"); setIsSidebarOpen(true); }} className={`p-2.5 rounded-xl ${activeTab==="media"?"bg-blue-600 text-white":"text-gray-500 hover:text-white"}`}><VideoCameraIcon className="w-6 h-6"/></button>
                    <button onClick={() => { setActiveTab("text"); setIsSidebarOpen(true); }} className={`p-2.5 rounded-xl ${activeTab==="text"?"bg-blue-600 text-white":"text-gray-500 hover:text-white"}`}><ChatBubbleBottomCenterTextIcon className="w-6 h-6"/></button>
                    <button onClick={() => { setActiveTab("uploads"); setIsSidebarOpen(true); }} className={`p-2.5 rounded-xl ${activeTab==="uploads"?"bg-blue-600 text-white":"text-gray-500 hover:text-white"}`}><FolderIcon className="w-6 h-6"/></button>
                </div>
                {isSidebarOpen && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
                        <div className="p-3 border-b border-[#333]">
                           {activeTab === 'media' && <input placeholder="Search Pixabay..." className="bg-[#1E1E1E] border border-[#333] rounded w-full px-2 py-1 text-xs text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />}
                           {activeTab === 'uploads' && (
                               <label className="flex items-center gap-2 justify-center w-full bg-[#1E1E1E] border border-dashed border-[#444] rounded py-3 cursor-pointer hover:bg-[#252525]">
                                   <CloudArrowUpIcon className="w-5 h-5 text-gray-400"/>
                                   <span className="text-xs text-gray-400">Upload File</span>
                                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                               </label>
                           )}
                        </div>
                        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 content-start flex-1" onScroll={(e) => { if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight) loadMoreAssets(); }}>
                            {activeTab === "media" && mediaAssets.map((asset) => (
                                <div key={asset.id} draggable onDragStart={(e) => handleDragStart(e, asset)} onClick={() => addClipToTrack(-1, undefined, asset.src, 'image')} className="relative w-full pb-[100%] bg-gray-800 rounded cursor-pointer border border-transparent hover:border-blue-500 group overflow-hidden">
                                    <div className="absolute inset-0">
                                        <img src={asset.thumb || asset.src} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><PlusIcon className="w-6 h-6 text-white"/></div>
                                    </div>
                                </div>
                            ))}
                            {activeTab === "uploads" && uploadedAssets.map((asset) => (
                                <div key={asset.id} draggable onDragStart={(e) => handleDragStart(e, asset)} onClick={() => addClipToTrack(-1, undefined, asset.src, asset.type, asset.renderSrc)} className="relative w-full pb-[100%] bg-gray-800 rounded cursor-pointer border border-transparent hover:border-blue-500 group overflow-hidden">
                                    <div className="absolute inset-0">
                                        {asset.type === 'video' ? <div className="w-full h-full bg-gray-900 flex items-center justify-center text-xs text-gray-500">VIDEO</div> : 
                                         asset.type === 'audio' ? <div className="w-full h-full bg-gray-900 flex items-center justify-center text-xs text-gray-500">AUDIO</div> :
                                         <img src={asset.thumb || asset.src} className="w-full h-full object-cover"/>}
                                    </div>
                                </div>
                            ))}
                            {activeTab === "text" && <div onClick={() => addClipToTrack(-1, "HEADLINE", undefined, "text")} className="col-span-2 h-12 bg-[#1E1E1E] rounded flex items-center justify-center cursor-pointer hover:bg-gray-800 border border-transparent hover:border-blue-500"><h1 className="font-bold text-white">Add Headline</h1></div>}
                        </div>
                        <div className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50" onMouseDown={(e) => { e.preventDefault(); setResizingPanel('sidebar'); }} />
                    </div>
                )}
            </div>

            {/* STAGE */}
            <div 
                ref={stageContainerRef}
                className={`flex-1 bg-[#0f1115] relative overflow-hidden flex items-center justify-center ${isPanning ? 'cursor-grabbing' : 'cursor-default'} caret-transparent`} 
                onMouseDown={handleStageMouseDown} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            >
                <div 
                    className="flex items-center justify-center pointer-events-none" 
                    style={{ 
                        transform: `scale(${fitScale})`, 
                        transformOrigin: "center center",
                        width: currentRes.w,
                        height: currentRes.h
                    }}
                >
                    <div 
                        ref={stageRef} 
                        className="relative bg-black shadow-2xl pointer-events-auto" 
                        style={{ 
                            width: currentRes.w, 
                            height: currentRes.h,
                        }} 
                        onMouseDown={(e) => { if (e.button === 0) { setSelectedClipId(null); setContextMenu(null); } }}
                    >
                         {/* FIX: Use StageClip logic instead of inline video logic.
                             Also reverse tracks so top of list = top layer. 
                         */}
                        {[...tracks].reverse().map(track => {
                            if (track.isHidden) return null;
                            // Only render clips that are currently visible
                            const visibleClips = track.clips.filter(c => currentTime >= c.start && currentTime < (c.start + c.duration));
                            
                            return visibleClips.map(clip => (
                                <StageClip 
                                    key={clip.id} 
                                    clip={clip} 
                                    currentTime={currentTime} 
                                    isPlaying={isPlaying}
                                    isSelected={selectedClipId === clip.id}
                                    onSelect={(e) => { 
                                        if (e.button === 2) { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); 
                                            return; 
                                        }
                                        e.stopPropagation(); 
                                        e.preventDefault(); 
                                        setSelectedClipId(clip.id); 
                                        setTransforming({ id: clip.id, type: 'move', startX: e.clientX, startY: e.clientY, startProps: { ...clip.properties } }); 
                                    }}
                                    onContextMenu={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); 
                                    }}
                                    onTransform={(e, type, handle) => { 
                                        e.stopPropagation(); 
                                        const isCorner = handle ? handle.length === 2 : false;
                                        const pRatio = clip.properties.width / clip.properties.height;
                                        setTransforming({ 
                                            id: clip.id, 
                                            type, 
                                            handle, 
                                            startX: e.clientX, 
                                            startY: e.clientY, 
                                            startProps: { ...clip.properties }, 
                                            aspectRatio: (isCorner && clip.type === 'image') ? pRatio : undefined 
                                        }); 
                                    }}
                                    setEditingTextId={setEditingTextId}
                                />
                            ));
                        })}
                    </div>
                </div>
            </div>

            {/* INSPECTOR & TIMELINE (Standard layout) */}
            <div className="flex shrink-0 z-20 relative bg-[#161B26] border-l border-app-border flex-col" style={{ width: isInspectorCollapsed ? '40px' : inspectorWidth }}>
                {!isInspectorCollapsed && <div className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50" onMouseDown={(e) => { e.preventDefault(); setResizingPanel('inspector'); }} />}
                <div className={`border-b border-[#333] flex items-center ${isInspectorCollapsed ? 'justify-center p-2' : 'justify-between p-4'}`}>
                    {!isInspectorCollapsed && <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Properties</h3>}
                    <button onClick={() => setIsInspectorCollapsed(!isInspectorCollapsed)}>{isInspectorCollapsed ? <ChevronLeftIcon className="w-4 h-4 text-gray-500"/> : <ChevronRightIcon className="w-4 h-4 text-gray-500"/>}</button>
                </div>
                {!isInspectorCollapsed && <div className="flex-1 overflow-y-auto">
                    {selectedClip ? (
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="border-b border-[#333] pb-4">
                                    <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-gray-400 uppercase">Actions</h3></div>
                                    <div className="flex gap-2 mt-2">
                                         <button onClick={() => moveClipLayer(selectedClip.id, 'up')} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 flex items-center justify-center gap-1 border border-gray-700"><ChevronUpIcon className="w-3 h-3"/> Move Up</button>
                                         <button onClick={() => moveClipLayer(selectedClip.id, 'down')} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 flex items-center justify-center gap-1 border border-gray-700"><ChevronDownIcon className="w-3 h-3"/> Move Down</button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">Moves clip to adjacent track of same type.</p>
                                </div>

                                <div className="border-b border-[#333] pb-4">
                                    <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-gray-400 uppercase">Timing</h3></div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">Start</label><input type="number" step="0.1" min="0" value={selectedClip.start} onChange={(e) => updateClipDuration(parseFloat(e.target.value), undefined)} className="w-full bg-[#0B0E14] border border-[#333] rounded p-2 text-sm text-white"/></div>
                                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">End</label><input type="number" step="0.1" min="0" value={parseFloat((selectedClip.start + selectedClip.duration).toFixed(2))} onChange={(e) => updateClipDuration(undefined, parseFloat(e.target.value))} className="w-full bg-[#0B0E14] border border-[#333] rounded p-2 text-sm text-white"/></div>
                                    </div>
                                </div>
                                
                                {selectedClip.type === 'text' && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 font-bold">Content</label>
                                        <textarea 
                                            rows={3}
                                            className="w-full bg-[#0B0E14] border border-[#333] rounded p-2 text-sm text-white resize-none focus:border-blue-500 outline-none"
                                            value={selectedClip.content}
                                            onChange={(e) => updateClipProperty({ content: e.target.value })}
                                        />
                                    </div>
                                )}
                                
                                {(selectedClip.type === 'audio' || selectedClip.type === 'video') && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs text-gray-500 font-bold">Volume</label>
                                            <button onClick={() => resetProperty('volume')}><ArrowUturnLeftIcon className="w-3 h-3 text-blue-400 hover:text-white"/></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="0" max="2" step="0.1" value={selectedClip.properties.volume || 1} onChange={(e) => updateClipProperty({ volume: parseFloat(e.target.value) })} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-blue-500"/>
                                            <span className="w-12 text-xs text-center text-white">{((selectedClip.properties.volume || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                )}

                                {selectedClip.type !== 'audio' && (
                                    <>
                                        <div><div className="flex justify-between items-center mb-1"><label className="text-xs text-gray-500 font-bold">Opacity</label><button onClick={() => resetProperty('opacity')}><ArrowUturnLeftIcon className="w-3 h-3 text-blue-400 hover:text-white"/></button></div><div className="flex items-center gap-2"><input type="range" min="0" max="1" step="0.01" value={selectedClip.properties.opacity} onChange={(e) => updateClipProperty({ opacity: parseFloat(e.target.value) })} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-blue-500"/><input type="number" step="0.1" min="0" max="1" value={selectedClip.properties.opacity} onChange={(e) => updateClipProperty({ opacity: parseFloat(e.target.value) })} className="w-12 bg-[#0B0E14] border border-[#333] rounded p-1 text-xs text-white text-center"/></div></div>
                                        <div><div className="flex justify-between items-center mb-1"><label className="text-xs text-gray-500 font-bold">Rotation</label><button onClick={() => resetProperty('rotation')}><ArrowUturnLeftIcon className="w-3 h-3 text-blue-400 hover:text-white"/></button></div><div className="flex items-center gap-2"><input type="range" min="-180" max="180" value={Math.round(selectedClip.properties.rotation)} onChange={(e) => updateClipProperty({ rotation: parseInt(e.target.value) })} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-blue-500"/><input type="number" value={Math.round(selectedClip.properties.rotation)} onChange={(e) => updateClipProperty({ rotation: parseInt(e.target.value) })} className="w-12 bg-[#0B0E14] border border-[#333] rounded p-1 text-xs text-white text-center"/></div></div>
                                    </>
                                )}
                                
                                {selectedClip.type === 'text' && <>
                                    <div><label className="text-xs text-gray-500 font-bold block mb-1">Color</label><input type="color" value={selectedClip.properties.color} onChange={(e) => updateClipProperty({ color: e.target.value })} className="w-full h-8 bg-[#0B0E14] border border-[#333] rounded"/></div>
                                    <div><label className="text-xs text-gray-500 font-bold block mb-1">Font Size</label><input type="number" value={selectedClip.properties.fontSize} onChange={(e) => updateClipProperty({ fontSize: parseInt(e.target.value) })} className="w-full bg-[#0B0E14] border border-[#333] rounded p-2 text-sm"/></div>
                                </>}
                            </div>
                            <button onClick={() => deleteClip(selectedClip.id)} className="w-full py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded font-bold text-xs hover:bg-red-900/40">Remove</button>
                        </div>
                    ) : <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-2 h-full"><CursorArrowRippleIcon className="w-10 h-10 opacity-30"/><p className="text-xs">Select an element</p></div>}
                </div>}
            </div>
        </div>

        {/* BOTTOM TIMELINE */}
        <div className="flex flex-col relative shrink-0 z-30 bg-[#121212] border-t border-app-border" style={{ height: isTimelineCollapsed ? '40px' : timelineHeight }}>
            {/* Resizer */}
            {!isTimelineCollapsed && <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 z-50" onMouseDown={(e) => { e.preventDefault(); setResizingPanel('timeline'); }} />}
            
            {/* Timeline Toolbar */}
            <div className="h-10 bg-[#161B26] border-b border-gray-800 flex items-center justify-between px-4 select-none shrink-0">
                <div className="flex gap-2 items-center">
                    <button onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)} className="mr-2 text-gray-500 hover:text-white">{isTimelineCollapsed ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}</button>
                    {!isTimelineCollapsed && (
                        <div className="flex gap-2 relative">
                            <button onClick={() => setAddTrackMenuOpen(!addTrackMenuOpen)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold"><PlusIcon className="w-3 h-3"/> Track</button>
                            {addTrackMenuOpen && <div className="absolute top-8 left-0 bg-[#252525] border border-[#444] rounded shadow-xl flex flex-col z-50 w-32">
                                {['text', 'image', 'audio', 'video'].map(t => <button key={t} onClick={() => { addTrack(t as TrackType); setAddTrackMenuOpen(false); }} className="px-3 py-2 text-left text-xs hover:bg-blue-600 text-gray-200 capitalize">{t} Track</button>)}
                            </div>}
                            <div className="w-px h-4 bg-gray-700 mx-2 self-center"></div>
                            <button className="p-1 hover:bg-gray-700 rounded text-gray-400"><ScissorsIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsLooping(!isLooping)} className={`p-1 rounded ${isLooping?'text-blue-400 bg-blue-400/10':'text-gray-500 hover:text-white'}`}><ArrowPathIcon className="w-4 h-4"/></button>
                    <button onClick={() => {setIsPlaying(false); setCurrentTime(0);}}><StopIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 bg-white rounded flex items-center justify-center text-black hover:scale-105 transition-transform">{isPlaying ? <PauseIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4 ml-0.5"/>}</button>
                    <div className="text-xs font-mono text-gray-400 w-20 text-center">{currentTime.toFixed(2)}s</div>
                </div>
                {!isTimelineCollapsed && <div className="flex items-center gap-2 w-40"><span className="text-[10px] text-gray-500">Zoom</span><input type="range" min={minZoom} max="200" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-gray-500"/></div>}
            </div>

            {!isTimelineCollapsed && (
                <div className="flex-1 flex bg-[#121212] overflow-hidden">
                    {/* --- LEFT SIDEBAR (HEADERS) --- */}
                    <div className="w-[200px] border-r border-gray-800 bg-[#121212] flex flex-col overflow-y-hidden z-20 shrink-0 mt-6">
                        <Reorder.Group axis="y" values={tracks} onReorder={(newTracks) => updateTracks(newTracks)} className="flex flex-col">
                            {tracks.map(track => (
                                <Reorder.Item key={track.id} value={track} className={`border-b border-gray-800 flex items-center px-2 bg-[#121212] group select-none ${track.type === 'text' ? 'h-12' : 'h-24'}`}>
                                    <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 cursor-grab mr-2"/>
                                    {/* --- ADDED: TRACK ICON RENDERING --- */}
                                    <div className="shrink-0">{getTrackIcon(track.type)}</div>
                                    
                                    {editingTrackName === track.id ? <input autoFocus className="bg-black text-xs w-full text-white px-1" defaultValue={track.label} onBlur={(e) => { updateTracks(prev => prev.map(t => t.id === track.id ? { ...t, label: e.target.value } : t)); setEditingTrackName(null); }} /> : <span onContextMenu={(e) => { e.preventDefault(); setEditingTrackName(track.id); }} className="text-[10px] font-bold text-gray-400 flex-1 truncate cursor-text">{track.label}</span>}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleTrackProp(track.id, 'isHidden')} className="text-gray-500 hover:text-white">{track.isHidden ? <EyeSlashIcon className="w-3 h-3"/> : <EyeIcon className="w-3 h-3"/>}</button>
                                        <button onClick={() => toggleTrackProp(track.id, 'isMuted')} className="text-gray-500 hover:text-white">{track.isMuted ? <SpeakerXMarkIcon className="w-3 h-3"/> : <SpeakerWaveIcon className="w-3 h-3"/>}</button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>

                    {/* --- RIGHT CONTENT (TIMELINE LANES) --- */}
                    <div 
                        className="flex-1 relative overflow-x-auto overflow-y-hidden custom-scrollbar" 
                        ref={timelineRef}
                        onMouseDown={(e) => { 
                            const rect = timelineRef.current!.getBoundingClientRect(); 
                            if (e.clientY - rect.top < 24) {
                                setScrubbing(true);
                                handleScrub(e);
                            }
                        }}
                    >
                        <div ref={tracksContainerRef} className="h-full relative" style={{ width: `${duration * zoom}px` }}>
                            {/* RULER */}
                            <div className="h-6 border-b border-gray-800 bg-[#0B0E14] relative">{renderRuler()}</div>
                            
                            {/* PLAYHEAD */}
                            <div className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: currentTime * zoom }}><div className="absolute -top-0 -left-1.5 w-3 h-3 bg-red-500 rotate-45" /></div>
                            
                            {/* TRACKS */}
                            <div className="flex flex-col">
                                {tracks.map(track => (
                                    <div 
                                        key={track.id} 
                                        data-track-id={track.id} 
                                        className={`relative border-b border-gray-800/50 ${track.isHidden ? 'opacity-30' : ''} ${track.type === 'text' ? 'h-12' : 'h-24'}`}
                                    >
                                        {track.clips.map(clip => (
                                            <div 
                                                key={clip.id} 
                                                className={`absolute top-1 bottom-1 rounded-sm text-[9px] flex items-center overflow-hidden cursor-move select-none shadow-sm ${selectedClipId === clip.id ? 'ring-1 ring-yellow-400 z-10' : ''} ${
                                                    clip.type === 'video' ? 'bg-blue-900/50 border-blue-800' : 
                                                    clip.type === 'text' ? 'bg-[#4C1D95] text-purple-200 border border-purple-800' : 
                                                    clip.type === 'audio' ? 'bg-[#BE185D] text-pink-200 border border-pink-800' :
                                                    'bg-[#064E3B] text-green-200 border border-green-800'
                                                }`} 
                                                style={{ 
                                                    left: clip.start * zoom, 
                                                    width: clip.duration * zoom,
                                                    ...(clip.type === 'image' && clip.src ? {
                                                        backgroundImage: `url(${clip.src})`,
                                                        backgroundRepeat: 'repeat-x',
                                                        backgroundSize: 'auto 100%',
                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                    } : {}),
                                                    ...(clip.type === 'audio' ? {
                                                        backgroundImage: generateWaveform(clip.id, '#FECDD3'),
                                                        backgroundRepeat: 'repeat-x',
                                                        backgroundSize: '100px 100%' 
                                                    } : {})
                                                }} 
                                                onMouseDown={(e) => { 
                                                    if (e.button === 2) { 
                                                        e.preventDefault(); 
                                                        e.stopPropagation(); 
                                                        setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); 
                                                    } else {
                                                        e.stopPropagation(); 
                                                        setSelectedClipId(clip.id); 
                                                        setDraggingClip({ id: clip.id, type: 'move', startX: e.clientX, originalStart: clip.start, originalDuration: clip.duration }); 
                                                    }
                                                }}
                                            >
                                                {clip.type === 'video' && clip.src && (
                                                    <>
                                                        <video src={clip.src} className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none grayscale" muted />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none"/>
                                                    </>
                                                )}

                                                {clip.type !== 'image' && clip.type !== 'video' && <span className="truncate px-2 pointer-events-none font-medium drop-shadow relative z-10">{clip.content || (clip.type === 'audio' ? 'Audio Clip' : 'Clip')}</span>}
                                                
                                                <div className="absolute right-0 top-0 bottom-0 w-3 hover:bg-white/20 cursor-e-resize z-20" onMouseDown={(e) => { e.stopPropagation(); setDraggingClip({ id: clip.id, type: 'trim', startX: e.clientX, originalStart: clip.start, originalDuration: clip.duration }); }} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* CONTEXT MENU */}
            {contextMenu && (
                <div 
                    className="fixed bg-[#161B26] border border-gray-700 shadow-xl rounded py-1 z-[100] w-40 text-xs text-white" 
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button onClick={() => moveClipLayer(contextMenu.clipId, 'up')} className="w-full text-left px-3 py-2 hover:bg-blue-600 flex items-center gap-2"><ChevronUpIcon className="w-3 h-3"/> Move Up Layer</button>
                    <button onClick={() => moveClipLayer(contextMenu.clipId, 'down')} className="w-full text-left px-3 py-2 hover:bg-blue-600 flex items-center gap-2"><ChevronDownIcon className="w-3 h-3"/> Move Down Layer</button>
                    <div className="h-px bg-gray-700 my-1"/>
                    <button onClick={() => { deleteClip(contextMenu.clipId); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-red-900/50 text-red-400 flex items-center gap-2"><TrashIcon className="w-3 h-3"/> Delete</button>
                </div>
            )}
        </div>
    </div>
  );
}