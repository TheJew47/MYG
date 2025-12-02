from moviepy.config import change_settings
change_settings({"IMAGEMAGICK_BINARY": "/usr/bin/convert"})

from moviepy.editor import (
    VideoFileClip, TextClip, CompositeVideoClip, 
    AudioFileClip, ImageClip, afx, CompositeAudioClip, ColorClip
)
from moviepy.video.fx.all import crop, margin
import os
import whisper
import asyncio
from PIL import Image as PILImage 
from app.engine.assets import generate_image_keywords, fetch_pixabay_image, download_file as fetch_url_file # Renamed to avoid clash
from app.engine import s3_utils # <--- NEW: Import S3 utilities
import numpy as np
import tempfile # <--- NEW: Use tempfile library for safer temp paths
import uuid

# Use the OS temp directory for the worker's processing
# We use Python's built-in tempfile to handle OS-agnostic temporary paths
OUTPUT_DIR = tempfile.gettempdir() 
RESOURCE_DIR = "/code/app/resources" # Static resources included in the Docker build


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def apply_vignette(clip, intensity):
    """
    Applies a vignette effect using a numpy mask.
    intensity: 0 to 100
    """
    if intensity <= 0: return clip
    
    # Create a radial gradient mask
    w, h = clip.size
    x = np.linspace(-1, 1, w)
    y = np.linspace(-1, 1, h)
    X, Y = np.meshgrid(x, y)
    
    # Calculate radius from center
    radius = np.sqrt(X**2 + Y**2)
    
    # Normalize intensity (0-100 -> 0.0-1.0 opacity at corners)
    factor = intensity / 100.0
    
    # Sigmoid-like or linear fade
    mask_layer = (radius ** 1.5) * factor
    mask_layer = np.clip(mask_layer, 0, 1) # Ensure valid alpha range
    
    mask_layer_img = np.dstack([mask_layer * 255]).astype('uint8') 
    
    vignette_clip = ColorClip(size=(w, h), color=(0,0,0), duration=clip.duration)
    
    # Convert numpy mask to ImageClip mask
    mask_clip = ImageClip(mask_layer, ismask=True).set_duration(clip.duration)
    vignette_clip = vignette_clip.set_mask(mask_clip)
    
    return CompositeVideoClip([clip, vignette_clip])


def render_video(task_data: dict, audio_path: str, progress_callback=None) -> str:
    # List to hold temporary paths created during processing for cleanup
    temp_files_to_clean = []
    if audio_path: temp_files_to_clean.append(audio_path)

    def report(p):
        if progress_callback: progress_callback(p)

    # --- 1. DYNAMIC RESOLUTION PARSING ---
    res_str = task_data.get('resolution', '1080x1920')
    try:
        W, H = map(int, res_str.split('x'))
    except:
        W, H = 1080, 1920

    # --- EXTRACT SETTINGS ---
    files = task_data.get('files', {}) or {}
    # These are now S3 Keys from the API upload endpoint
    s3_bg_key = files.get('Background')
    s3_fg_key = files.get('Foreground')
    
    bg_color_hex = task_data.get('background_color') 
    generate_images = task_data.get('generate_images', True) 
    no_captions = task_data.get('no_captions', False)
    keep_bg_audio = task_data.get('keep_background_audio', False)
    
    vignette_intensity = task_data.get('vignette_intensity', 0)
    
    captions = task_data.get('captions', {})
    FONT = captions.get('font', 'Liberation-Sans-Bold')
    FONT_SIZE = captions.get('size', 80)
    FONT_COLOR = captions.get('color', 'yellow')
    FONT_Y = captions.get('y_pos', int(H * 0.7)) 
    FONT_X = captions.get('x_pos', 'center')
    WORDS_PER_SCREEN = captions.get('words_per_screen', 1)

    # --- 2. SETUP AUDIO ---
    report(20)
    print(f"Loading Audio: {audio_path}")
    if audio_path:
        voiceover = AudioFileClip(audio_path)
        duration = voiceover.duration
    else:
        duration = 10
        voiceover = None

    # --- 3. SETUP BACKGROUND ---
    report(40)
    
    bg_source = None
    
    if bg_color_hex:
        print(f"Using Solid Background: {bg_color_hex}")
        rgb_color = hex_to_rgb(bg_color_hex)
        bg_clip = ColorClip(size=(W, H), color=rgb_color, duration=duration)
    else:
        if s3_bg_key:
            # 3a. DOWNLOAD BACKGROUND FROM S3
            print(f"Downloading Background from S3: {s3_bg_key}")
            # Use a unique temporary filename
            bg_source = os.path.join(OUTPUT_DIR, f"bg_{uuid.uuid4()}_{os.path.basename(s3_bg_key)}")
            s3_utils.download_file_from_s3(s3_bg_key, bg_source)
            temp_files_to_clean.append(bg_source)
        else:
            # Fallback to static resource
            bg_source = os.path.join(RESOURCE_DIR, "background.mp4")
            
        print(f"Using Background File: {bg_source}")

        if os.path.exists(bg_source):
            ext = bg_source.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'webp']:
                bg_clip = ImageClip(bg_source).set_duration(duration)
            else:
                bg_clip = VideoFileClip(bg_source)
                if bg_clip.duration < duration:
                    bg_clip = bg_clip.loop(duration=duration)
                else:
                    bg_clip = bg_clip.subclip(0, duration)
        else:
            print("Background file not found, defaulting to black.")
            bg_clip = ColorClip(size=(W, H), color=(0,0,0), duration=duration)

        # Smart resize/crop to fill dimensions
        bg_ratio = bg_clip.w / bg_clip.h
        target_ratio = W / H
        
        if bg_clip.w != W or bg_clip.h != H:
            if abs(bg_ratio - target_ratio) > 0.01:
                if bg_ratio > target_ratio:
                    new_w = int(bg_clip.h * target_ratio)
                    center_x = bg_clip.w / 2
                    bg_clip = crop(bg_clip, x1=center_x - new_w/2, width=new_w, height=bg_clip.h)
                elif bg_ratio < target_ratio:
                    new_h = int(bg_clip.w / target_ratio)
                    center_y = bg_clip.h / 2
                    bg_clip = crop(bg_clip, y1=center_y - new_h/2, width=bg_clip.w, height=new_h)
            
            bg_clip = bg_clip.resize(width=W, height=H)

    # Apply Vignette
    if vignette_intensity > 0:
        bg_clip = apply_vignette(bg_clip, vignette_intensity)

    if voiceover:
        if keep_bg_audio and bg_clip.audio:
            bg_audio = bg_clip.audio.volumex(0.2)
            final_audio = CompositeAudioClip([bg_audio, voiceover])
            final_clip = bg_clip.set_audio(final_audio)
        else:
            final_clip = bg_clip.set_audio(voiceover)
    else:
        final_clip = bg_clip if keep_bg_audio and bg_clip.audio else bg_clip.without_audio()

    # --- 4. VISUALS & CAPTIONS ---
    image_clips = []
    text_clips = []
    
    # 4a. DOWNLOAD FOREGROUND FROM S3 (IF PROVIDED)
    if s3_fg_key:
        print("Using Foreground Override from S3")
        custom_fg = os.path.join(OUTPUT_DIR, f"fg_{uuid.uuid4()}_{os.path.basename(s3_fg_key)}")
        s3_utils.download_file_from_s3(s3_fg_key, custom_fg)
        temp_files_to_clean.append(custom_fg)
        
        fg_ext = custom_fg.split('.')[-1].lower()
        if fg_ext in ['jpg', 'jpeg', 'png', 'webp']:
             fg_clip = ImageClip(custom_fg).set_duration(duration).resize(width=W).set_position("center")
        else:
             fg_clip = VideoFileClip(custom_fg).resize(width=W).set_position("center")
             if fg_clip.duration > duration: fg_clip = fg_clip.subclip(0, duration)
             else: fg_clip = fg_clip.loop(duration=duration)
        image_clips.append(fg_clip)
    
    # 4b. AI IMAGE GENERATION (Logic remains, but file management is local /tmp)
    elif audio_path:
        # NOTE: This section assumes that the transcription and image keyword logic 
        # (which relies on fetch_pixabay_image and fetch_url_file) is correctly 
        # saving downloaded images to the worker's local /tmp directory (OUTPUT_DIR).
        
        print(f"Generating Visuals... Generate Images Flag: {generate_images}")
        try:
            model = whisper.load_model("tiny")
            result = model.transcribe(audio_path, word_timestamps=True)
            segments = result['segments']
            
            report(65)
            
            # --- AI IMAGES ---
            if generate_images:
                print(f"Whisper found {len(segments)} segments.")
                subtitle_dict = {int(s['start']): s['text'] for s in segments}
                
                keyword_dict = asyncio.run(generate_image_keywords(subtitle_dict))
                
                report(70)
                
                for start_time, keyword in keyword_dict.items():
                    sorted_keys = sorted(keyword_dict.keys())
                    idx = sorted_keys.index(start_time)
                    end_time = sorted_keys[idx+1] if idx + 1 < len(sorted_keys) else duration
                    img_duration = end_time - start_time
                    
                    print(f"Fetching image for '{keyword}' at {start_time}s")
                    img_url = asyncio.run(fetch_pixabay_image(keyword))
                    
                    if img_url:
                        local_img_path = os.path.join(OUTPUT_DIR, f"img_{uuid.uuid4()}_{start_time}.jpg")
                        try:
                            # Use the existing utility to download the web image to the local temp path
                            asyncio.run(fetch_url_file(img_url, local_img_path))
                            temp_files_to_clean.append(local_img_path) # Mark for cleanup
                            
                            if os.path.exists(local_img_path) and os.path.getsize(local_img_path) > 0:
                                with PILImage.open(local_img_path) as pimg:
                                    pimg = pimg.convert("RGB")
                                    pimg.save(local_img_path) # Re-save to confirm format

                                img_clip = (
                                    ImageClip(local_img_path)
                                    .set_start(start_time)
                                    .set_duration(img_duration)
                                    .resize(height=int(H * 0.4)) 
                                    .set_position(("center", int(H * 0.2)))
                                )
                                image_clips.append(img_clip)
                                print(f"-> Image added: {local_img_path}")
                            else:
                                print(f"-> Failed to download: {local_img_path}")
                        except Exception as e:
                            print(f"-> Image Processing Error: {e}")

            report(75)

            # --- CAPTIONS ---
            if not no_captions:
                print("Generating Captions...")
                all_words = []
                for segment in segments:
                    if 'words' in segment:
                        all_words.extend(segment['words'])
                    else:
                        all_words.append({'word': segment['text'], 'start': segment['start'], 'end': segment['end']})

                for i in range(0, len(all_words), WORDS_PER_SCREEN):
                    chunk = all_words[i : i + WORDS_PER_SCREEN]
                    if not chunk: continue
                    
                    text_str = " ".join([w['word'].strip() for w in chunk])
                    start_t = chunk[0]['start']
                    end_t = chunk[-1]['end']

                    text_box_w = int(W * 0.8)

                    txt = TextClip(
                        text_str,
                        fontsize=FONT_SIZE,
                        color=FONT_COLOR,
                        font=FONT,
                        method='caption',
                        align='center',
                        size=(text_box_w, None)
                    )
                    
                    # Position calculation remains the same
                    x_coord = FONT_X
                    y_coord = FONT_Y
                    
                    if isinstance(x_coord, int):
                        final_x = x_coord - (txt.w // 2)
                        final_y = y_coord - (txt.h // 2)
                        txt = txt.set_position((final_x, final_y))
                    elif x_coord == 'center':
                        txt = txt.set_position(('center', FONT_Y))
                    else: # If a string like 'center' is provided for Y
                        txt = txt.set_position((x_coord, y_coord))

                    txt = txt.set_start(start_t).set_end(end_t)
                    text_clips.append(txt)

        except Exception as e:
            print(f"AI Generation Critical Error: {e}")
            import traceback
            traceback.print_exc()

    # --- 5. RENDER ---
    report(80)
    print(f"Rendering Video with {len(image_clips)} images and {len(text_clips)} captions...")
    final_composite = CompositeVideoClip([final_clip] + image_clips + text_clips, size=(W, H))
    
    output_filename = f"final_{task_data.get('id', 'temp')}.mp4"
    # Use the /tmp location which is the worker's temporary storage
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    final_composite.write_videofile(
        output_path, fps=24, codec="libx264", audio_codec="aac", preset="ultrafast", threads=4
    )
    
    # --- 6. CLEANUP ---
    # Delete all temporary files to free up disk space in the /tmp worker environment
    for f_path in temp_files_to_clean:
        try: os.remove(f_path)
        except OSError: pass
    
    # Returns the local path to the pipeline for the final S3 upload
    return output_path