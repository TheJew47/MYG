import os
import httpx
import random
import google.generativeai as genai
import ast

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

async def generate_image_keywords(script_segments: dict):
    """
    Uses Gemini to convert a dict of {time: text} into {time: "search_term"}
    """
    if not GEMINI_API_KEY:
        return {}

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are an AI helper. Replace every value in this dictionary with a single, specific, 
    visual search term (1-2 words) that represents the text conceptually. 
    Example: {{0: "Did you know mummies were eaten?", 5: "It is true."}} -> {{0: "Mummy", 5: "Ancient Scroll"}}
    
    Input Dictionary: {script_segments}
    
    Return ONLY the valid Python dictionary string. No markdown, no code blocks.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean up code blocks if Gemini adds them
        if text.startswith("```"):
            text = text.replace("```python", "").replace("```", "").strip()
        
        return ast.literal_eval(text)
    except Exception as e:
        print(f"Keyword Gen Error: {e}")
        # Fallback: use the last word of the segment
        return {k: v.split()[-1] for k, v in script_segments.items()}

async def fetch_pixabay_image(query: str):
    """
    Fetches a single photo URL for a query.
    """
    if not PIXABAY_API_KEY: 
        print("Pixabay API Key missing")
        return None
    
    url = "https://pixabay.com/api/"
    
    params = {
        "key": PIXABAY_API_KEY,
        "q": query,
        "image_type": "photo",
        "orientation": "horizontal",
        "per_page": 3
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, params=params)
            
            if res.status_code != 200:
                print(f"Pixabay returned status {res.status_code} for {query}")
                return None

            data = res.json()
            hits = data.get("hits", [])
            if hits:
                return hits[0].get("largeImageURL")
            else:
                print(f"No hits found on Pixabay for '{query}'")
                
        except Exception as e:
            print(f"Pixabay Error for {query}: {e}")
    return None

async def download_file(url: str, dest_path: str):
    if not url.startswith("http"):
        print(f"Invalid download URL: {url}")
        return

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, follow_redirects=True)
            with open(dest_path, "wb") as f:
                f.write(resp.content)
        except Exception as e:
            print(f"Download failed for {url}: {e}")