import logging
import os
import tempfile
import uuid
from app.engine import ideation, audio, video
from app.engine import s3_utils # <--- NEW IMPORT
from app.config import settings # <--- NEW IMPORT

logger = logging.getLogger(__name__)

def run_pipeline(task_data: dict, progress_callback=None):
    """
    The main sequence of the Loom Engine.
    Handles file orchestration between S3 and local /tmp storage.
    """
    def report(p):
        if progress_callback: progress_callback(p)

    files = task_data.get('files', {}) or {}
    s3_custom_audio_key = files.get('Audio Track')
    
    # Extract Audio Settings
    voice = task_data.get('voice', 'af_heart')
    speed = task_data.get('audio_speed', 1.0)
    
    # --- Temp File Tracking ---
    audio_path = None
    final_video_path = None

    try:
        # 1. IDEATION (10-20%)
        if not task_data.get('scripts') and not s3_custom_audio_key:
            report(10)
            logger.info("Generating script via AI...")
            # ideation.generate_idea is called
            # NOTE: If you pass custom_audio, script generation is skipped by ideation.py logic.
            idea = ideation.generate_idea(topic=task_data.get('title'), duration="30 Seconds")
            task_data['scripts'] = idea['text']
        
        script_text = task_data.get('scripts', '')
        
        # 2. AUDIO (20-40%)
        report(20)
        if s3_custom_audio_key:
            # 2a. DOWNLOAD CUSTOM AUDIO FROM S3
            logger.info(f"Downloading custom audio from S3: {s3_custom_audio_key}")
            # Use tempfile to get a unique, safe local path in /tmp
            audio_path = os.path.join(tempfile.gettempdir(), f"custom_audio_{uuid.uuid4()}.wav") 
            s3_utils.download_file_from_s3(s3_custom_audio_key, audio_path)
            report(40)
        else:
            if script_text:
                logger.info(f"Generating TTS (Kokoro - {voice} @ {speed}x)...")
                # 2b. TTS generates file locally in /tmp
                audio_path = audio.generate_tts(script_text, voice=voice, speed=speed)
                report(40)
            # If no script and no custom audio, audio_path remains None

        # 3. VIDEO EDITING (40-80%)
        logger.info("Rendering Video...")
        # video.render_video handles downloading background/foreground assets internally
        final_video_path = video.render_video(task_data, audio_path, progress_callback)
        report(80)
        
        # 4. FINAL UPLOAD TO S3 (80-100%)
        logger.info(f"Uploading final video {os.path.basename(final_video_path)} to S3...")
        
        # Define the permanent S3 key for the final video
        final_s3_key = f"completed/{os.path.basename(final_video_path)}"
        
        with open(final_video_path, 'rb') as f:
            file_content = f.read()
            s3_utils.upload_file_to_s3(file_content, final_s3_key, 'video/mp4')
            
        report(90)

        return {
            "video_url": final_s3_key, # Store the S3 Key/Path, NOT the full URL
            "script_used": script_text
        }
        
    finally:
        # Clean up temporary files on the worker's disk
        if audio_path and os.path.exists(audio_path):
            try: os.remove(audio_path)
            except OSError: logger.warning(f"Could not remove temp audio file: {audio_path}")
            
        if final_video_path and os.path.exists(final_video_path):
            try: os.remove(final_video_path)
            except OSError: logger.warning(f"Could not remove final video file: {final_video_path}")
            
        logger.info("Temporary files cleaned up.")