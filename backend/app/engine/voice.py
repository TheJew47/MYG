import os
import uuid
import logging
from gradio_client import Client, handle_file
from app.config import settings
from app.engine import s3_utils 

logger = logging.getLogger(__name__)

# Use the ID from config or the specific one provided in your snippet
VOICE_SPACE_ID = settings.VOICE_SPACE_ID or "amoghkrishnan/chatterbox-tts"

def generate_voice(text: str, audio_prompt_url: str = None) -> str:
    """
    Calls the Chatterbox TTS Space. 
    Matches the 2-parameter API: (text, audio_prompt)
    """
    if not settings.HF_TOKEN:
        raise ValueError("HF_TOKEN is not configured in .env")
    
    try:
        logger.info(f"🎤 Connecting to TTS Space: {VOICE_SPACE_ID}")
        client = Client(VOICE_SPACE_ID, token=settings.HF_TOKEN)
        
        # Wrap the URL/Path in handle_file as required by Gradio 5.x+
        audio_input = handle_file(audio_prompt_url) if audio_prompt_url else None
        
        # The Space API only takes 2 arguments: text and audio_prompt
        result = client.predict(
            text=text,
            audio_prompt=audio_input,
            api_name="/generate_tts"
        )
        
        # result is the path to the temporary .wav file
        if os.path.exists(result):
            with open(result, "rb") as f:
                audio_bytes = f.read()
            
            file_name = f"voice_{uuid.uuid4()}.wav"
            s3_key = f"generated_audio/{file_name}"
            
            logger.info(f"📦 Uploading generated voice to S3: {s3_key}")
            s3_utils.upload_file_to_s3(audio_bytes, s3_key, "audio/wav")
            
            # Cleanup local Gradio temp file
            if os.path.exists(result):
                os.remove(result)
                
            return s3_key
        else:
            raise FileNotFoundError(f"Generated file not found at {result}")
            
    except Exception as e:
        logger.error(f"--- VOICE ENGINE ERROR: {str(e)} ---")
        raise e