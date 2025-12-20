from moviepy.config import change_settings
change_settings({"IMAGEMAGICK_BINARY": "/usr/bin/convert"})

from moviepy.editor import (
    VideoFileClip, TextClip, CompositeVideoClip, 
    AudioFileClip, ImageClip, afx, CompositeAudioClip, ColorClip
)
from moviepy.video.fx.all import crop, margin
import os
import whisper
import asyncio
from PIL import Image as PILImage 
from app.engine.assets import generate_image_keywords, fetch_pixabay_image, download_file as fetch_url_file 
from app.engine import s3_utils 
import numpy as np
import tempfile 
import uuid

# Use the OS temp directory for the worker's processing
OUTPUT_DIR = tempfile.gettempdir() 
RESOURCE_DIR = "/code/app/resources" 

# --- UTILS ---

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def apply_vignette(clip, intensity):
    if intensity <= 0: return clip
    w, h = clip.size
    x = np.linspace(-1, 1, w)
    y = np.linspace(-1, 1, h)
    X, Y = np.meshgrid(x, y)
    radius = np.sqrt(X**2 + Y**2)
    factor = intensity / 100.0
    mask_layer = (radius ** 1.5) * factor
    mask_layer = np.clip(mask_layer, 0, 1) 
    vignette_clip = ColorClip(size=(w, h), color=(0,0,0), duration=clip.duration)
    mask_clip = ImageClip(mask_layer, ismask=True).set_duration(clip.duration)
    vignette_clip = vignette_clip.set_mask(mask_clip)
    return CompositeVideoClip([clip, vignette_clip])

# --- NLE RENDERING ENGINE ---

def render_timeline(timeline_data: list, output_path: str, width: int, height: int, duration: float, fps: int = 24):
    visual_clips = []
    audio_clips = []
    
    # 1. Base Layer (Background Color)
    visual_clips.append(ColorClip(size=(width, height), color=(0,0,0), duration=duration))

    print(f"Rendering Timeline: {len(timeline_data)} tracks, Duration: {duration}s, FPS: {fps}")

    for track in timeline_data:
        if track.get('isHidden'): continue
        is_muted = track.get('isMuted', False)
        
        for clip_data in track.get('clips', []):
            try:
                c_type = clip_data.get('type')
                src = clip_data.get('renderSrc') or clip_data.get('src')
                
                # --- ASSET RESOLUTION ---
                local_path = None
                if src and c_type in ['video', 'image', 'audio']:
                    if src.startswith("blob:"): 
                        print(f"Skipping blob URL: {src}")
                        continue
                    
                    # Check if it's already a local file (e.g. from TTS)
                    if os.path.exists(src):
                        local_path = src
                    else:
                        clean_name = os.path.basename(src).split('?')[0][-20:] 
                        local_path = os.path.join(OUTPUT_DIR, f"clip_{uuid.uuid4()}_{clean_name}")
                        
                        if src.startswith("http"):
                            import asyncio
                            asyncio.run(fetch_url_file(src, local_path))
                        else:
                            s3_utils.download_file_from_s3(src, local_path)

                    if not os.path.exists(local_path):
                        print(f"Failed to resolve asset: {src}")
                        continue

                # --- TIMING ---
                start = float(clip_data.get('start', 0))
                dur = float(clip_data.get('duration', 5))
                props = clip_data.get('properties', {})
                volume = float(props.get('volume', 1.0))

                # --- AUDIO CLIPS ---
                if c_type == 'audio':
                    if is_muted: continue
                    
                    au_clip = AudioFileClip(local_path)
                    
                    # Loop if needed (though usually we trim)
                    if au_clip.duration < dur:
                        au_clip = afx.audio_loop(au_clip, duration=dur)
                    else:
                        au_clip = au_clip.subclip(0, dur)
                    
                    au_clip = au_clip.set_start(start).volumex(volume)
                    audio_clips.append(au_clip)
                    continue

                # --- VISUAL CLIPS ---
                mp_clip = None
                
                if c_type == 'text':
                    content = clip_data.get('content', 'Text')
                    font_size = props.get('fontSize', 60)
                    color = props.get('color', 'white')
                    
                    mp_clip = TextClip(
                        content, 
                        fontsize=font_size, 
                        color=color, 
                        font='Liberation-Sans-Bold',
                        method='caption', 
                        align='center',
                        size=(int(width * 0.8), None)
                    )
                elif c_type == 'video':
                    mp_clip = VideoFileClip(local_path)
                    # Handle Video Audio
                    if not is_muted and mp_clip.audio is not None:
                        vid_audio = mp_clip.audio
                        if mp_clip.duration < dur:
                            vid_audio = afx.audio_loop(vid_audio, duration=dur)
                        else:
                            vid_audio = vid_audio.subclip(0, dur)
                        vid_audio = vid_audio.set_start(start).volumex(volume)
                        audio_clips.append(vid_audio)
                elif c_type == 'image':
                    mp_clip = ImageClip(local_path)
                
                if not mp_clip: continue

                # Trim & Loop Visuals
                if c_type == 'video':
                    if mp_clip.duration < dur:
                        mp_clip = mp_clip.loop(duration=dur)
                    else:
                        mp_clip = mp_clip.subclip(0, dur)
                else:
                    mp_clip = mp_clip.set_duration(dur)
                
                mp_clip = mp_clip.set_start(start)

                # Visual Properties
                p_width = float(props.get('width', 100))
                target_w = width * (p_width / 100.0)
                mp_clip = mp_clip.resize(width=target_w)

                p_op = float(props.get('opacity', 1.0))
                if p_op < 1.0: mp_clip = mp_clip.set_opacity(p_op)

                p_rot = float(props.get('rotation', 0))
                if p_rot != 0: mp_clip = mp_clip.rotate(-p_rot)

                # Position (Center Anchor)
                p_x = float(props.get('x', 50))
                p_y = float(props.get('y', 50))
                
                center_x_px = width * (p_x / 100.0)
                center_y_px = height * (p_y / 100.0)
                
                pos_x = center_x_px - (mp_clip.w / 2)
                pos_y = center_y_px - (mp_clip.h / 2)
                
                mp_clip = mp_clip.set_position((pos_x, pos_y))

                visual_clips.append(mp_clip)

            except Exception as e:
                print(f"Error processing clip {clip_data.get('id')}: {e}")
                import traceback
                traceback.print_exc()

    # 2. Composite Visuals
    final_video = CompositeVideoClip(visual_clips, size=(width, height)).set_duration(duration)
    
    # 3. Composite Audio
    if audio_clips:
        print(f"Mixing {len(audio_clips)} audio streams...")
        final_audio = CompositeAudioClip(audio_clips)
        final_video = final_video.set_audio(final_audio)
    
    # 4. Write File
    final_video.write_videofile(
        output_path, 
        fps=fps,  # <--- USES DYNAMIC FPS
        codec="libx264", 
        audio_codec="aac", 
        preset="ultrafast", 
        threads=4
    )
    return output_path


def render_video(task_data: dict, audio_path: str, progress_callback=None) -> str:
    temp_files_to_clean = []
    if audio_path: temp_files_to_clean.append(audio_path)

    def report(p):
        if progress_callback: progress_callback(p)

    res_str = task_data.get('resolution', '1080x1920')
    fps = task_data.get('fps', 24) # <--- Extract FPS
    
    try: W, H = map(int, res_str.split('x'))
    except: W, H = 1080, 1920
        
    if task_data.get('timeline'):
        print(">> RENDERING NLE TIMELINE MODE")
        report(20)
        timeline = task_data['timeline']
        
        # Calculate duration
        explicit_duration = task_data.get('duration')
        if explicit_duration:
             max_duration = float(explicit_duration)
        else:
             max_duration = 0
             for track in timeline:
                for clip in track.get('clips', []):
                    end = float(clip.get('start', 0)) + float(clip.get('duration', 0))
                    if end > max_duration: max_duration = end
             if max_duration == 0: max_duration = 10 
        
        report(40)
        filename = f"final_{task_data.get('id', 'temp')}.mp4"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        return render_timeline(timeline, output_path, W, H, max_duration, fps) # Pass FPS

    return "error_no_timeline"