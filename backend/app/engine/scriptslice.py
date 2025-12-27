# myg/backend/app/engine/scriptslice.py
import whisper # type: ignore
import os
import tempfile
from app.engine import s3_utils

def mp3_to_timestamp_dict(audio_src):
    """
    Transcribes an audio file (local path or S3 key) and returns a dictionary.
    Key: Start time in seconds (float)
    Value: The transcribed text
    """
    local_path = audio_src
    is_temp = False

    # 1. Resolve S3 key to a local file if necessary
    if not os.path.exists(audio_src):
        print(f"📥 Downloading audio from S3 for transcription: {audio_src}")
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, f"transcribe_{os.path.basename(audio_src)}")
        s3_utils.download_file_from_s3(audio_src, local_path)
        is_temp = True

    try:
        # 2. Load the Whisper model
        # Using 'medium' for high accuracy as requested in your original logic
        print("🎙️ Loading Whisper 'medium' model...")
        model = whisper.load_model("medium")

        # 3. Transcribe the audio
        print(f"🔍 Transcribing: {local_path}...")
        result = model.transcribe(local_path)

        # 4. Extract segments and build the dictionary {start_time: text}
        timestamp_dict = {}
        for segment in result['segments']:
            start_time = round(segment['start'], 2)  # Rounding to 2 decimal places
            text = segment['text'].strip()
            timestamp_dict[start_time] = text

        return timestamp_dict

    except Exception as e:
        print(f"❌ Transcription Error: {str(e)}")
        raise e
    finally:
        # 5. Cleanup temporary downloaded audio
        if is_temp and os.path.exists(local_path):
            os.remove(local_path)

if __name__ == "__main__":
    # Example usage for standalone testing
    # data = mp3_to_timestamp_dict("your-s3-key-or-local-path.wav")
    # print(data)
    pass