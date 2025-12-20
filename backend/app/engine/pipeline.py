import logging
import os
import tempfile
import uuid
from app.engine import ideation, audio, video
from app.engine import s3_utils 
from app.config import settings 

logger = logging.getLogger(__name__)

def run_pipeline(task_data: dict, progress_callback=None):
    def report(p):
        if progress_callback: progress_callback(p)

    timeline = task_data.get('timeline')
    
    # --- BRANCH: NLE RENDER MODE ---
    if timeline and len(timeline) > 0:
        logger.info("Timeline data detected. Starting NLE Render...")
        try:
            # Direct render
            final_video_path = video.render_video(task_data, None, progress_callback)
            
            # Upload
            report(90)
            final_s3_key = f"completed/{os.path.basename(final_video_path)}"
            
            with open(final_video_path, 'rb') as f:
                file_content = f.read()
                s3_utils.upload_file_to_s3(file_content, final_s3_key, 'video/mp4')

            # Cleanup
            if os.path.exists(final_video_path): os.remove(final_video_path)

            return {
                "video_url": final_s3_key,
                "script_used": "N/A (Timeline Render)"
            }
        except Exception as e:
            logger.error(f"NLE Render Failed: {e}")
            raise e

    # --- BRANCH: LEGACY / WIZARD MODE (Converted to Timeline) ---
    logger.info("Wizard mode detected. Converting to Timeline...")
    files = task_data.get('files', {}) or {}
    s3_custom_audio_key = files.get('Audio Track')
    voice = task_data.get('voice', 'af_heart')
    speed = task_data.get('audio_speed', 1.0)
    
    temp_files = [] # Track temp files for cleanup

    try:
        # 1. Ideation (if no script provided)
        if not task_data.get('scripts') and not s3_custom_audio_key:
            report(10)
            idea = ideation.generate_idea(topic=task_data.get('title'), duration="30 Seconds")
            task_data['scripts'] = idea['text']
        
        script_text = task_data.get('scripts', '')
        
        # 2. Audio Preparation
        report(20)
        audio_src = None
        
        if s3_custom_audio_key:
            # If user uploaded audio, use it directly (render_timeline handles S3 keys)
            audio_src = s3_custom_audio_key
        elif script_text:
            # Generate TTS locally
            audio_path = audio.generate_tts(script_text, voice=voice, speed=speed)
            audio_src = audio_path
            temp_files.append(audio_path)
            report(40)

        # 3. Construct Timeline
        # We build a simple timeline: 
        # Track 1: Background (Image/Video/Color)
        # Track 2: Foreground (Image/Video)
        # Track 3: Audio (TTS or Upload)
        
        constructed_timeline = []

        # -- Audio Track --
        if audio_src:
            constructed_timeline.append({
                "id": 103, "type": "audio", "label": "Main Audio", "isMuted": False,
                "clips": [{
                    "id": "audio-main", "type": "audio", "src": audio_src,
                    "start": 0, "duration": 30, # Default, will be trimmed by file length
                    "properties": { "volume": 1.0 }
                }]
            })

        # -- Background Track --
        bg_src = files.get('Background')
        if bg_src:
            constructed_timeline.append({
                "id": 102, "type": "video" if bg_src.endswith(('.mp4','.mov')) else "image", 
                "label": "Background", "isMuted": True,
                "clips": [{
                    "id": "bg-main", "type": "video" if bg_src.endswith(('.mp4','.mov')) else "image", 
                    "src": bg_src, "start": 0, "duration": 30,
                    "properties": { "width": 100, "height": 100, "x": 50, "y": 50, "opacity": 1 }
                }]
            })
        
        # -- Foreground Track --
        fg_src = files.get('Foreground')
        if fg_src:
             constructed_timeline.append({
                "id": 101, "type": "video" if fg_src.endswith(('.mp4','.mov')) else "image", 
                "label": "Foreground", "isMuted": False,
                "clips": [{
                    "id": "fg-main", "type": "video" if fg_src.endswith(('.mp4','.mov')) else "image", 
                    "src": fg_src, "start": 0, "duration": 30,
                    "properties": { "width": 80, "height": 80, "x": 50, "y": 50, "opacity": 1 }
                }]
            })

        # Update task data with new timeline and recursive call
        task_data['timeline'] = constructed_timeline
        if not task_data.get('duration'): task_data['duration'] = 30 # Default

        return run_pipeline(task_data, progress_callback)
        
    finally:
        for p in temp_files:
            if os.path.exists(p):
                try: os.remove(p)
                except: pass