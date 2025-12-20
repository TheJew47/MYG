import os
import uuid
import soundfile as sf
import torch
from kokoro import KPipeline
import numpy as np

OUTPUT_DIR = "/tmp/loom_runtime"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Global cache for pipeline to avoid reloading weights on every request
_PIPELINE_CACHE = {}

VOICES = {
    "af_heart": "🇺🇸 Heart (Female)",
    "af_bella": "🇺🇸 Bella (Female)",
    "af_sarah": "🇺🇸 Sarah (Female)",
    "af_nicole": "🇺🇸 Nicole (Female)",
    "af_sky": "🇺🇸 Sky (Female)",
    "am_adam": "🇺🇸 Adam (Male)",
    "am_michael": "🇺🇸 Michael (Male)",
    "bf_emma": "🇬🇧 Emma (Female)",
    "bf_isabella": "🇬🇧 Isabella (Female)",
    "bm_george": "🇬🇧 George (Male)",
    "bm_lewis": "🇬🇧 Lewis (Male)",
}

def get_pipeline(lang_code):
    if lang_code not in _PIPELINE_CACHE:
        print(f"Loading Kokoro Pipeline for '{lang_code}'...")
        # device = 'cuda' if torch.cuda.is_available() else 'cpu' 
        # Forcing cpu for stability in this specific docker setup unless gpu is passed
        _PIPELINE_CACHE[lang_code] = KPipeline(lang_code=lang_code)
    return _PIPELINE_CACHE[lang_code]

def list_voices():
    return [{"id": k, "name": v} for k, v in VOICES.items()]

def generate_kokoro(text: str, voice: str = "af_heart", speed: float = 1.0) -> str:
    """
    Generates audio using Kokoro82M.
    """
    unique_id = str(uuid.uuid4())
    output_file = os.path.join(OUTPUT_DIR, f"audio_{unique_id}.wav")
    
    try:
        # Determine lang code based on voice prefix (af_ = american, bf_ = british)
        lang = 'b' if voice.startswith('b') else 'a'
        
        pipeline = get_pipeline(lang)
        
        # Generate generator
        generator = pipeline(text, voice=voice, speed=speed, split_pattern=r'\n+')
        
        # Concatenate all audio segments
        all_audio = []
        for i, (gs, ps, audio) in enumerate(generator):
            all_audio.append(audio)
            
        if not all_audio:
            raise Exception("No audio generated")
            
        final_audio = np.concatenate(all_audio)
        
        # Write to file (24khz is Kokoro standard)
        sf.write(output_file, final_audio, 24000)
        
        return output_file
    except Exception as e:
        print(f"Kokoro Generation Error: {e}")
        raise e

# Legacy wrapper if needed, or just replace usage
def generate_tts(text: str, voice: str = "af_heart", speed: float = 1.0) -> str:
    return generate_kokoro(text, voice, speed)