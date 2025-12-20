from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import shutil
import os
import uuid
import traceback 

from app.models import Base, Project, Task, User
from app.auth import get_current_user_id
from worker.tasks import generate_video_task
from app.schemas.task_schema import TaskCreateRequest, CaptionSettings
from app.engine import audio as audio_engine
from app.engine import ideation as ideation_engine
from app.engine import assets as assets_engine
from app.engine import s3_utils 
from app.engine.huggingface import generate_flux_image, generate_ltx_video
from app.config import DATABASE_URL, settings 

# Setup DB 
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine) 

app = FastAPI(title="Miyog Engine")

origins = [
    "http://localhost:3000",        
    "http://127.0.0.1:3000",        
    "http://3.216.174.254:8000",   
    "*"                             
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SHARED DIRECTORIES
RUNTIME_DIR = "/tmp/loom_runtime" 
os.makedirs(RUNTIME_DIR, exist_ok=True) 

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class GenerateScriptRequest(BaseModel):
    topic: str
    duration: str = "30 Seconds"

class ProjectCreate(BaseModel):
    title: str
    description: str = None
    platform: str = "YouTube"
    color_code: str = "#000000"
    emoji: str = "VP"

class AudioPreviewRequest(BaseModel):
    text: str
    voice: str
    speed: float = 1.0

class ImageGenRequest(BaseModel):
    prompt: str

# Use the same request model for video as for image
class VideoGenRequest(BaseModel):
    prompt: str

# --- ENDPOINTS ---

@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email=f"{user_id}@placeholder.miyog.com")
        db.add(user)
        db.commit()
    return db.query(Project).filter(Project.owner_id == user_id).all()

@app.post("/api/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_project = Project(**project.dict(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not project: 
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": project.id, "title": project.title, "tasks": project.tasks}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not settings.S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 Bucket not configured")

    file_ext = file.filename.split(".")[-1] if "." in file.filename else "tmp"
    s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"

    file_content = await file.read()
    s3_utils.upload_file_to_s3(file_content, s3_key, file.content_type)
    
    return {"path": s3_key, "filename": file.filename}

# --- AI GENERATION ---

@app.post("/api/ai/generate_image")
async def ai_generate_image(request: ImageGenRequest, user_id: str = Depends(get_current_user_id)):
    try:
        image_bytes = generate_flux_image(request.prompt)
        s3_key = f"generated/{user_id}/{uuid.uuid4()}.png"
        s3_utils.upload_file_to_s3(image_bytes, s3_key, "image/png")
        signed_url = s3_utils.generate_signed_url(s3_key)
        return {"url": signed_url}
    except Exception as e:
        print(f"IMAGE GEN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_video")
async def ai_generate_video(request: VideoGenRequest, user_id: str = Depends(get_current_user_id)):
    """
    Endpoint for generating LTX-Video via the ZeroGPU Space.
    """
    try:
        # 1. Generate via ZeroGPU Space
        video_bytes = generate_ltx_video(request.prompt)
        
        # 2. Upload to S3
        s3_key = f"generated/{user_id}/{uuid.uuid4()}.mp4"
        s3_utils.upload_file_to_s3(video_bytes, s3_key, "video/mp4")
        
        # 3. Return Signed URL
        signed_url = s3_utils.generate_signed_url(s3_key)
        
        return {"url": signed_url}
    except Exception as e:
        print(f"VIDEO GEN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- AUDIO & VOICES ---

@app.get("/api/audio/voices")
def get_available_voices():
    return audio_engine.list_voices()

@app.post("/api/audio/preview")
def generate_audio_preview(request: AudioPreviewRequest):
    try:
        file_path = audio_engine.generate_kokoro(request.text, request.voice, request.speed)
        filename = os.path.basename(file_path)
        return {"url": f"/api/video/temp/{filename}"} 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ASSET SEARCH ---
@app.get("/api/assets/search")
async def search_assets(q: str, page: int = 1):
    return await assets_engine.search_pixabay(q, page)

# --- AI SCRIPT GEN ---
@app.post("/api/ai/generate_script")
def generate_script(request: GenerateScriptRequest):
    try:
        idea = ideation_engine.generate_idea(topic=request.topic, duration=request.duration)
        return {"script": idea["text"], "hook": idea["hook"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

# --- STREAMING ---
@app.get("/api/video/temp/{filename}")
async def stream_temp_file(filename: str):
    file_path = os.path.join(RUNTIME_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Temporary file not found")
    
    media_type = "audio/wav" if filename.endswith(".wav") else "video/mp4"
    return FileResponse(file_path, media_type=media_type)


@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    real_video_url = None
    if task.video_url and not task.video_url.startswith("/api/video/temp/"): 
        real_video_url = s3_utils.generate_signed_url(task.video_url) 
    elif task.video_url:
        real_video_url = task.video_url

    return {
        "id": task.id,
        "status": task.status,
        "progress": task.progress, 
        "video_url": real_video_url, 
        "title": task.title,
        "script": task.script,
        "generate_images": task.generate_images,
        "captions": {
            "font": task.caption_font,
            "size": task.caption_size,
            "color": task.caption_color,
            "y_pos": task.caption_y,
            "words_per_screen": task.caption_words_per_screen
        }
    }

@app.post("/api/tasks/generate")
def create_task(request: TaskCreateRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    project = db.query(Project).filter(Project.id == request.project_id, Project.owner_id == user_id).first()
    if not project:
         raise HTTPException(status_code=403, detail="Not authorized")

    caps = request.captions or CaptionSettings()

    new_task = Task(
        title=request.title or "Untitled AI Video",
        description=request.description,
        script=request.scripts,
        status="Processing",
        resolution=request.resolution,
        project_id=request.project_id,
        progress=0,
        background_color=request.background_color,
        generate_images=request.generate_images,
        vignette_intensity=request.vignette_intensity,
        caption_font=caps.font,
        caption_size=caps.size,
        caption_color=caps.color,
        caption_y=caps.y_pos,
        caption_words_per_screen=caps.words_per_screen
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    task_payload = request.dict(by_alias=True)
    task_payload['id'] = new_task.id 
    
    generate_video_task.delay(task_payload)
    
    return {"status": "queued", "task_id": new_task.id}

from mangum import Mangum
handler = Mangum(app)