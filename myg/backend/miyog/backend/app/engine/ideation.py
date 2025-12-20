import os
import random
import re
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")

def generate_idea(topic: str = None, duration: str = "30 Seconds"):
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set")
        
    genai.configure(api_key=API_KEY)

    categories = {
        "Deep Philosophy": "Uncomfortable truths about life.",
        "Money Psychology": "Psychology tricks to save money.",
        "Dark History": "Historical facts school refused to teach you.",
        "Space Horror": "Scary facts about the universe.",
        "Life Advice": "Tips to get ahead in life.",
        "Motivation": "High energy motivation to start your day."
    }

    if topic:
        category = topic
        hook = f"Let's talk about {topic}"
    else:
        category, hook = random.choice(list(categories.items()))

    # Calculate approximate word count target (avg 150 words per minute)
    # 30s ~ 75 words, 60s ~ 150 words
    target_words = 75
    if "15" in duration: target_words = 40
    elif "60" in duration or "Minute" in duration: target_words = 150

    prompt = f'''
    You are a viral video scriptwriter. Write a {duration} script about "{category}".
    Target word count: approximately {target_words} words.
    
    CRITICAL RULES FOR TTS (TEXT-TO-SPEECH):
    1. Output ONLY the spoken words. Do NOT include labels like "Hook:", "Body:", "Scene 1", or "Narrator:".
    2. Do NOT use markdown bolding (**text**) or italics.
    3. Do NOT use emojis.
    4. Write as a continuous flow of spoken sentences.
    5. Keep it punchy, simple, and engaging (Grade 5 English).
    '''

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    clean_text = response.text.replace("*", "").replace("#", "").replace("Hook:", "").replace("Narrator:", "").strip()
    clean_text = re.sub(r'\n+', ' ', clean_text)
    
    word_count = len(re.findall(r'\b\w+\b', clean_text))

    return {
        "text": clean_text,
        "word_count": word_count,
        "category": category,
        "hook": hook,
        "generated_by": "models/gemini-2.5-flash"
    }