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
from app.engine import s3_utils # <--- NEW: Imports S3 utility
from app.config import DATABASE_URL, settings # <--- NEW: Imports DB string and settings

# Setup DB (UPDATED FOR POSTGRESQL)
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine) # Creates tables on PostgreSQL

app = FastAPI(title="Miyog Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SHARED DIRECTORIES
RUNTIME_DIR = "/tmp/loom_runtime" # Used for audio previews and temporary worker staging
os.makedirs(RUNTIME_DIR, exist_ok=True) # Ensure runtime dir exists

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class GenerateScriptRequest(BaseModel):
    topic: str
    duration: str = "30 Seconds"

# --- Project Schema ---
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
    # --- UPDATED FOR S3: Uploads file directly to S3 bucket ---
    if not settings.S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 Bucket not configured")

    file_ext = file.filename.split(".")[-1] if "." in file.filename else "tmp"
    # Define the unique path/key in S3
    s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"

    # Read file content
    file_content = await file.read()
    
    # Use the S3 utility function to upload
    s3_utils.upload_file_to_s3(file_content, s3_key, file.content_type)
    
    # Returns the S3 Key (path in S3), not a local disk path
    return {"path": s3_key, "filename": file.filename}


# --- AUDIO & VOICES ---

@app.get("/api/audio/voices")
def get_available_voices():
    return audio_engine.list_voices()

@app.post("/api/audio/preview")
def generate_audio_preview(request: AudioPreviewRequest):
    try:
        # TTS generates a temporary audio file locally in /tmp for quick playback
        file_path = audio_engine.generate_kokoro(request.text, request.voice, request.speed)
        filename = os.path.basename(file_path)
        # Return URL pointing to the local stream endpoint below
        return {"url": f"/api/video/temp/{filename}"} 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AI SCRIPT GEN ---
@app.post("/api/ai/generate_script")
def generate_script(request: GenerateScriptRequest):
    try:
        print(f"Generating script for topic: {request.topic} ({request.duration})")
        
        # Pass duration to engine
        idea = ideation_engine.generate_idea(topic=request.topic, duration=request.duration)
        return {"script": idea["text"], "hook": idea["hook"]}
    except Exception as e:
        print(f"❌ GENERATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

# --- TEMPORARY AUDIO/VIDEO STREAMING (Only for local previews, files live in /tmp) ---
@app.get("/api/video/temp/{filename}")
async def stream_temp_file(filename: str):
    file_path = os.path.join(RUNTIME_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Temporary file not found")
    
    # Infer media type based on extension
    media_type = "audio/wav" if filename.endswith(".wav") else "video/mp4"
    return FileResponse(file_path, media_type=media_type)

# DELETED OLD ENDPOINTS:
# @app.get("/api/video/{filename}")
# @app.get("/api/video/{filename}/download")

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    real_video_url = None
    if task.video_url and not task.video_url.startswith("/api/video/temp/"): # Final video URL should be an S3 key
        # Use the S3 Key saved in task.video_url to generate a secure, temporary link
        real_video_url = s3_utils.generate_signed_url(task.video_url) 
    
    # If video_url starts with "/api/video/temp/", it means it's a local preview link (e.g., from generate_audio_preview)
    elif task.video_url:
        real_video_url = task.video_url


    return {
        "id": task.id,
        "status": task.status,
        "progress": task.progress, 
        "video_url": real_video_url, # Now returns a secure S3 Signed URL or None
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

# --- AWS LAMBDA HANDLER ---
# This allows the FastAPI app to be run as a Lambda function via Mangum adapter.
from mangum import Mangum
handler = Mangum(app)
