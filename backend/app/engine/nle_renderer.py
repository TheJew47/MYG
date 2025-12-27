# myg/backend/app/engine/nle_renderer.py

import os
import uuid
import asyncio
import logging
import tempfile
import numpy as np
from moviepy.config import change_settings
from moviepy.editor import (
    VideoFileClip, TextClip, CompositeVideoClip, 
    AudioFileClip, ImageClip, ColorClip, CompositeAudioClip
)
from app.engine.assets import download_file as fetch_url_file 
from app.engine import s3_utils 

# Configure ImageMagick for text rendering (Standard Linux path)
# Note: Ensure ImageMagick is installed on the EC2 instance: sudo apt-get install imagemagick
change_settings({"IMAGEMAGICK_BINARY": "/usr/bin/convert"})

logger = logging.getLogger(__name__)
OUTPUT_DIR = tempfile.gettempdir() 

# --- UTILITIES ---

def hex_to_rgb(hex_color):
    """
    Converts #RRGGBB to (R, G, B) tuple.
    Robustly handles potential None inputs.
    """
    if not hex_color:
        return (0, 0, 0)
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# --- CORE RENDERING ENGINE ---

async def process_nle_task(task_data: dict, progress_callback=None):
    """
    Entry point for NLE Export requests.
    Downloads assets, builds the MoviePy composition, and uploads the result to S3.
    """
    def report(p):
        if progress_callback: progress_callback(p)

    report(5)
    
    # 1. Parse Resolution & FPS
    res_str = task_data.get('resolution', '1920x1080')
    fps = task_data.get('fps', 24)
    try:
        width, height = map(int, res_str.split('x'))
    except Exception:
        width, height = 1920, 1080
    
    timeline = task_data.get('timeline', [])
    duration = float(task_data.get('duration', 0))

    # Calculate duration if missing based on the last clip's end time
    if duration <= 0:
        for track in timeline:
            for clip in track.get('clips', []):
                end = float(clip.get('start', 0)) + float(clip.get('duration', 0))
                duration = max(duration, end)

    logger.info(f"Starting NLE Render: {width}x{height} @ {fps}fps, {duration}s")
    
    visual_clips = []
    audio_clips = []
    
    # 2. Base Background Layer
    # FIXED: Use 'or' to handle cases where background_color is explicitly None in the payload
    raw_bg = task_data.get('background_color') or '#000000'
    bg_color = hex_to_rgb(raw_bg)
    visual_clips.append(ColorClip(size=(width, height), color=bg_color, duration=duration))

    # 3. Process Tracks & Clips
    # Tracks are processed in order (Bottom of list in JSON = Top layer in MoviePy)
    for track_index, track in enumerate(timeline):
        if track.get('isHidden'): continue
        is_muted = track.get('isMuted', False)
        
        for clip_data in track.get('clips', []):
            try:
                c_type = clip_data.get('type')
                src = clip_data.get('renderSrc') or clip_data.get('src')
                
                # Resolve Asset Path (Localize S3 or Remote URLs)
                local_path = None
                if src and c_type in ['video', 'image', 'audio']:
                    if src.startswith("blob:"): continue # Skip frontend-only blobs
                    
                    if os.path.exists(src):
                        local_path = src
                    else:
                        ext = os.path.splitext(src.split('?')[0])[1] or ".tmp"
                        local_path = os.path.join(OUTPUT_DIR, f"nle_{uuid.uuid4()}{ext}")
                        
                        if src.startswith("http"):
                            await fetch_url_file(src, local_path)
                        else:
                            s3_utils.download_file_from_s3(src, local_path)

                # Metadata & Properties
                start = float(clip_data.get('start', 0))
                dur = float(clip_data.get('duration', 1))
                props = clip_data.get('properties', {})
                volume = float(props.get('volume', 1.0))

                # Build Audio Clip
                if c_type == 'audio':
                    if is_muted or not local_path: continue
                    au = AudioFileClip(local_path)
                    # Subclip ensures we don't exceed actual file duration
                    au = au.subclip(0, min(dur, au.duration))
                    audio_clips.append(au.set_start(start).volumex(volume))
                    continue

                # Build Visual Clip
                mp_clip = None
                if c_type == 'text':
                    mp_clip = TextClip(
                        clip_data.get('content', ''), 
                        fontsize=props.get('fontSize', 60), 
                        color=props.get('color', 'white'), 
                        font='Liberation-Sans-Bold',
                        method='caption', 
                        align='center',
                        size=(int(width * (props.get('width', 80) / 100)), None)
                    )
                elif c_type == 'video' and local_path:
                    mp_clip = VideoFileClip(local_path)
                    # Extract internal audio if not muted
                    if not is_muted and mp_clip.audio:
                        v_au = mp_clip.audio.subclip(0, min(dur, mp_clip.duration))
                        audio_clips.append(v_au.set_start(start).volumex(volume))
                    
                    if mp_clip.duration < dur: mp_clip = mp_clip.loop(duration=dur)
                    else: mp_clip = mp_clip.subclip(0, dur)
                elif c_type == 'image' and local_path:
                    mp_clip = ImageClip(local_path).set_duration(dur)

                if not mp_clip: continue

                # Apply Transformations
                mp_clip = mp_clip.set_start(start)
                
                # Scaling Logic (Cover mode if 100% width/height, otherwise manual)
                p_w, p_h = float(props.get('width', 100)), float(props.get('height', 100))
                if p_w == 100 and p_h == 100 and c_type != 'text':
                    scale = max(width / mp_clip.w, height / mp_clip.h)
                    mp_clip = mp_clip.resize(scale)
                else:
                    mp_clip = mp_clip.resize(width=width * (p_w / 100.0))

                if float(props.get('opacity', 1)) < 1:
                    mp_clip = mp_clip.set_opacity(props['opacity'])
                if float(props.get('rotation', 0)) != 0:
                    mp_clip = mp_clip.rotate(-props['rotation'])

                # Positioning (Convert editor 0-100 coordinates to MoviePy pixels)
                p_x, p_y = float(props.get('x', 50)), float(props.get('y', 50))
                pos_x = (width * (p_x / 100.0)) - (mp_clip.w / 2)
                pos_y = (height * (p_y / 100.0)) - (mp_clip.h / 2)
                mp_clip = mp_clip.set_position((pos_x, pos_y))

                visual_clips.append(mp_clip)

            except Exception as e:
                logger.error(f"Error processing NLE clip: {e}")

    report(60)

    # 4. Composite & Render
    final_video = CompositeVideoClip(visual_clips, size=(width, height)).set_duration(duration)
    if audio_clips:
        final_video = final_video.set_audio(CompositeAudioClip(audio_clips))

    output_filename = f"export_{uuid.uuid4()}.mp4"
    local_output = os.path.join(OUTPUT_DIR, output_filename)
    
    # Write final file using fast presets for NLE feedback
    final_video.write_videofile(
        local_output, 
        fps=fps, 
        codec="libx264", 
        audio_codec="aac", 
        preset="ultrafast", 
        threads=4
    )
    
    report(90)

    # 5. Upload to S3 & Cleanup
    s3_key = f"completed/{output_filename}"
    with open(local_output, 'rb') as f:
        s3_utils.upload_file_to_s3(f.read(), s3_key, 'video/mp4')

    if os.path.exists(local_output): os.remove(local_output)
    
    report(100)
    return {"video_url": s3_key}