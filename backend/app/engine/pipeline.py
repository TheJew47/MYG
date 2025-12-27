# myg/backend/app/engine/pipeline.py
import logging
import os
import uuid
import json 
from app.engine import ideation, video, voice, scriptslice, json_processor, huggingface
from app.engine import s3_utils 
from app.config import settings 

logger = logging.getLogger(__name__)

def run_pipeline(task_data: dict, progress_callback=None):
    """
    The Standalone AI execution flow:
    Script Generation -> TTS (Voice) -> ScriptSlice (Transcription) -> JSON Optimize -> Batch Video -> Render
    
    This function is strictly for automated content creation and is kept separate from 
    direct NLE timeline rendering.
    """
    def report(p):
        if progress_callback: progress_callback(p)

    # 1. INITIAL SCRIPT GENERATION
    # Generates a script and hook based on the topic if no script is provided.
    if not task_data.get('scripts'):
        report(5)
        logger.info("Generating script from title...")
        idea = ideation.generate_idea(topic=task_data.get('topic', task_data.get('title')), duration="30 Seconds")
        task_data['scripts'] = idea['text']
    
    script_text = task_data['scripts']
    report(10)

    try:
        # 2. VOICE GENERATION (TTS -> S3)
        # Converts the script text into an AI voice narration.
        voice_prompt_key = task_data.get('voice_url') or task_data.get('voice_prompt')
        voice_prompt_signed_url = None
        
        if voice_prompt_key:
            logger.info(f"Generating signed URL for voice prompt: {voice_prompt_key}")
            voice_prompt_signed_url = s3_utils.generate_signed_url(voice_prompt_key)

        logger.info("Step 2: Generating AI Voice narration...")
        audio_s3_key = voice.generate_voice(script_text, voice_prompt_signed_url)
        report(25)

        # 3. SCRIPT SLICING (Audio -> Transcription Dictionary)
        # Uses Whisper to determine exactly when each word is spoken.
        logger.info("Step 3: Slicing script into timestamps using Whisper...")
        raw_timestamps = scriptslice.mp3_to_timestamp_dict(audio_s3_key)
        report(40)

        # 4. JSON OPTIMIZATION
        # Calls the amoghkrishnan/VIDEO-TIMESTAMPED-JSON Space to group timestamps into video segments.
        logger.info("Step 4: Optimizing JSON via amoghkrishnan/VIDEO-TIMESTAMPED-JSON...")
        optimized_segments = json_processor.optimize_transcription_for_video(raw_timestamps)
        
        # --- TESTING: PRINT OPTIMIZED JSON ---
        print("\n" + "="*50)
        print("DEBUG: OPTIMIZED JSON OUTPUT")
        print("="*50)
        print(json.dumps(optimized_segments, indent=4))
        print("="*50 + "\n")

        # 5. BATCH VIDEO GENERATION
        # Generates multiple cinematic video clips based on the optimized segments.
        logger.info("Step 5: Batch generating cinematic video segments...")
        video_segments = huggingface.generate_ltx_video_batch(optimized_segments)
        report(75)

        # 6. CONSTRUCT TIMELINE FOR RENDERER
        # Builds a structured NLE-style timeline from the AI-generated assets.
        logger.info("Step 6: Constructing render timeline...")
        timeline = []
        video_clips = []
        
        # Ensure timestamps are floats for sorting
        sorted_timestamps = sorted([float(ts) for ts in video_segments.keys()])
        
        # Calculate precise max duration based on the start of the last clip + 5 seconds buffer
        total_video_duration = 0
        if sorted_timestamps:
            total_video_duration = sorted_timestamps[-1] + 5.0
        
        for i, ts in enumerate(sorted_timestamps):
            start_time = ts
            # Calculate duration based on next segment or final end
            duration = (sorted_timestamps[i+1] - ts) if i < len(sorted_timestamps)-1 else 5.0
            
            video_clips.append({
                "id": f"clip-{ts}",
                "type": "video",
                "src": video_segments[ts], 
                "start": start_time,
                "duration": duration,
                "properties": { "width": 100, "height": 100, "x": 50, "y": 50, "opacity": 1 }
            })

        # -- Track 1: The AI Visuals --
        timeline.append({
            "id": 101, "type": "video", "label": "AI Visuals", "isMuted": False,
            "clips": video_clips
        })

        # -- Track 2: The Narration Audio --
        timeline.append({
            "id": 102, "type": "audio", "label": "Narration", "isMuted": False,
            "clips": [{
                "id": "narration-main", "type": "audio", "src": audio_s3_key,
                "start": 0, 
                "duration": total_video_duration, 
                "properties": { "volume": 1.0 }
            }]
        })

        # 7. FINAL RENDER
        # Passes the generated timeline to the moviepy-based renderer.
        logger.info("Step 7: Finalizing and rendering video...")
        task_data['timeline'] = timeline
        task_data['duration'] = total_video_duration
        
        # Ensure resolution is landscape (1920x1080) for this pipeline
        if not task_data.get('resolution') or task_data.get('resolution') == '1080x1920':
             task_data['resolution'] = '1920x1080'
             
        final_video_path = video.render_video(task_data, None, progress_callback)
        
        # 8. UPLOAD FINAL VIDEO TO S3
        final_s3_key = f"completed/final_{uuid.uuid4()}.mp4"
        with open(final_video_path, 'rb') as f:
            s3_utils.upload_file_to_s3(f.read(), final_s3_key, 'video/mp4')

        # Cleanup local temporary file
        if os.path.exists(final_video_path): os.remove(final_video_path)

        report(100)
        return {
            "video_url": final_s3_key,
            "script_used": script_text
        }

    except Exception as e:
        logger.error(f"❌ Pipeline Failed: {str(e)}")
        raise e