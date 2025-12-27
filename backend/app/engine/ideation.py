import os
import re
from gradio_client import Client
from app.config import settings

# Hardcoded Space ID as requested
SCRIPT_SPACE_ID = "amoghkrishnan/script_gen"

def generate_idea(topic: str, duration: str = "30 Seconds"):
    """
    Calls the custom Qwen-2.5-7B-Instruct Space to generate a technical narration script.
    """
    if not settings.HF_TOKEN:
        raise ValueError("HF_TOKEN is not configured in the environment.")
    
    # Calculate max tokens based on requested duration
    max_tokens = 512
    if "15" in duration: 
        max_tokens = 256
    elif "60" in duration or "Minute" in duration: 
        max_tokens = 1024

    try:
        # Initialize Gradio client
        client = Client(SCRIPT_SPACE_ID, token=settings.HF_TOKEN)
        
        # Call the prediction endpoint matching your Space's signature
        # Inputs: prompt (Textbox), max_length (Slider), temperature (Slider)
        result = client.predict(
            topic,                   # Maps to 'prompt' in your Space
            int(max_tokens),         # Maps to 'max_length'
            0.7,                     # Maps to 'temperature'
            api_name="/generate_script"
        )
        
        # 1. Basic cleanup of the response
        clean_text = result.strip()
        
        # 2. Remove any bracketed scene descriptions [like this]
        clean_text = re.sub(r'\[.*?\]', '', clean_text)
        
        # 3. Remove markdown symbols (*, #) that interfere with TTS
        clean_text = clean_text.replace("*", "").replace("#", "").strip()
        
        # 4. Collapse multiple newlines into single spaces
        clean_text = re.sub(r'\n+', ' ', clean_text)
        
        word_count = len(re.findall(r'\b\w+\b', clean_text))

        return {
            "text": clean_text,
            "word_count": word_count,
            "topic": topic,
            "hook": "Narrator",
            "generated_by": f"huggingface/{SCRIPT_SPACE_ID}"
        }

    except Exception as e:
        print(f"--- SCRIPT ENGINE ERROR ---")
        print(f"Space ID: {SCRIPT_SPACE_ID}")
        print(f"Error: {str(e)}")
        raise e