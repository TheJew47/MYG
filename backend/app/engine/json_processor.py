# myg/backend/app/engine/json_processor.py
import json
import logging
from gradio_client import Client
from app.config import settings

logger = logging.getLogger(__name__)

def optimize_transcription_for_video(transcription_dict: dict) -> list:
    """
    Sends the raw transcription dictionary to the JSON-OPTIMIZER Space.
    Updates the API call to use the '/process_timeline' endpoint.
    """
    if not settings.HF_TOKEN:
        raise ValueError("HF_TOKEN is not configured in the environment.")
    
    # Use the ID from config
    space_id = settings.VIDEO_JSON_SPACE_ID or "amoghkrishnan/VIDEO-TIMESTAMPED-JSON"

    try:
        logger.info(f"🧠 Optimizing timestamps via Space: {space_id}...")
        
        # Convert dictionary to a string for transmission
        raw_input_json = json.dumps(transcription_dict)

        client = Client(space_id, token=settings.HF_TOKEN)
        
        # Matches the Space endpoint: /process_timeline
        # Matches the Space parameter: json_input
        result = client.predict(
            json_input=raw_input_json,
            api_name="/process_timeline"
        )
        
        # The space returns a cleaned JSON string; parse it back to a list
        optimized_data = json.loads(result)
        
        logger.info(f"✅ JSON Optimization Complete. Received {len(optimized_data)} segments.")
        return optimized_data

    except Exception as e:
        logger.error(f"--- JSON PROCESSOR ERROR ---")
        logger.error(f"Space ID: {space_id}")
        logger.error(f"Error: {str(e)}")
        raise e