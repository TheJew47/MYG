# myg/backend/app/engine/huggingface.py
import os
import requests
import uuid
import logging
from gradio_client import Client
from app.config import settings
from app.engine import s3_utils 

logger = logging.getLogger(__name__)

def generate_flux_image(prompt: str) -> bytes:
    """
    Calls Hugging Face FLUX.1-schnell via Serverless Inference API.
    """
    API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
    
    headers = {
        "Authorization": f"Bearer {settings.HF_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": 4
        }
    }
    
    logger.info(f"🚀 Sending request to Hugging Face (Flux): {prompt}")
    
    response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    
    if response.status_code != 200:
        logger.error(f"❌ Flux API Error: {response.status_code} - {response.text}")
        raise Exception(f"Hugging Face Error: {response.status_code} - {response.text}")
        
    return response.content

def generate_ltx_video(prompt: str, aspect_ratio: str = "16:9") -> bytes:
    """
    Individual video generation.
    Passes aspect_ratio to the Gradio Space.
    """
    logger.info(f"🎬 Generating individual video: {prompt} | Ratio: {aspect_ratio}")
    try:
        client = Client(settings.VIDEO_SPACE_ID, token=settings.HF_TOKEN)
        result = client.predict(
            prompt=prompt,
            aspect_ratio=aspect_ratio, # Updated to match Gradio inputs
            api_name="/predict"
        )
        
        with open(result, "rb") as f:
            content = f.read()
            
        if os.path.exists(result):
            os.remove(result)
            
        return content
    except Exception as e:
        logger.error(f"❌ Individual Video Generation Error: {str(e)}")
        raise e

def generate_ltx_video_batch(optimized_segments: dict, aspect_ratio: str = "16:9") -> dict:
    """
    Calls ZeroGPU Space for LTX-Video Generation for a batch of segments.
    Now supports aspect ratio selection.
    """
    logger.info(f"🚀 Initializing LTX-Video Space ({settings.VIDEO_SPACE_ID}) for batch... Ratio: {aspect_ratio}")
    
    s3_results = {}
    
    try:
        client = Client(settings.VIDEO_SPACE_ID, token=settings.HF_TOKEN)
        
        for timestamp, prompt in optimized_segments.items():
            logger.info(f"🎬 Generating {aspect_ratio} video for segment at {timestamp}s...")
            
            result = client.predict(
                prompt=prompt,
                aspect_ratio=aspect_ratio, # Passed to the Hugging Face Space
                api_name="/predict"
            )
            
            with open(result, "rb") as f:
                content = f.read()
            
            file_name = f"clip_{uuid.uuid4()}.mp4"
            s3_key = f"generated_segments/{file_name}"
            
            logger.info(f"📦 Storing segment in S3: {s3_key}")
            s3_utils.upload_file_to_s3(content, s3_key, "video/mp4")
            
            s3_results[float(timestamp)] = s3_key
            
            if os.path.exists(result):
                os.remove(result)
            
        return s3_results

    except Exception as e:
        logger.error(f"❌ Batch Video Generation Error: {str(e)}")
        raise e