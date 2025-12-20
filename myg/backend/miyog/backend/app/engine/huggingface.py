import os
import requests
from gradio_client import Client
from app.config import settings

# Your Space ID from Hugging Face
LTX_SPACE_ID = "amoghkrishnan/TEXT-TO-VIDEO"

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
    
    print(f"🚀 Sending request to Hugging Face (Flux): {prompt}")
    
    response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    
    if response.status_code != 200:
        print(f"❌ Flux API Error: {response.status_code} - {response.text}")
        raise Exception(f"Hugging Face Error: {response.status_code} - {response.text}")
        
    return response.content

def generate_ltx_video(prompt: str) -> bytes:
    """
    Calls your ZeroGPU Space for LTX-Video Generation.
    Strictly Text-to-Video using the DiffusionPipeline logic.
    """
    print(f"🚀 Calling ZeroGPU Video Space ({LTX_SPACE_ID}): {prompt}")
    
    try:
        # Initialize the Gradio client with your token for priority/private access
        client = Client(LTX_SPACE_ID, token=settings.HF_TOKEN)
        
        # Calling the '/predict' endpoint we defined in the Space app.py
        # It only takes the prompt as an argument.
        result = client.predict(
            prompt=prompt,
            api_name="/predict"
        )
        
        # Result is a local path to the generated .mp4 file on the EC2 instance
        video_path = result
        
        with open(video_path, "rb") as f:
            content = f.read()
        
        # Cleanup the temporary file downloaded by the client
        if os.path.exists(video_path):
            os.remove(video_path)
            
        return content

    except Exception as e:
        print(f"❌ LTX-Video ZeroGPU Error: {str(e)}")
        raise Exception(f"Video Generation Failed: {str(e)}")