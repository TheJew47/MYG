# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import uuid
import logging

from app.models import Base, Project, Task, User
from app.auth import get_current_user_id
from worker.tasks import generate_video_task
from app.schemas.task_schema import TaskCreateRequest
from app.engine import ideation as ideation_engine
from app.engine import voice as voice_engine
from app.engine import assets as assets_engine
from app.engine import s3_utils 
from app.engine.huggingface import generate_flux_image, generate_ltx_video
from app.config import DATABASE_URL, settings 

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup DB Connection
# pool_pre_ping ensures we don't send queries to a dropped Supabase connection
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Miyog Engine")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "https://myg-three.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Runtime Directory for FFmpeg processing
RUNTIME_DIR = "/tmp/loom_runtime" 
os.makedirs(RUNTIME_DIR, exist_ok=True) 

# Database Session Dependency
def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally: 
        db.close()

# --- REQUEST MODELS ---

class GenerateScriptRequest(BaseModel):
    topic: str
    duration: str = "30 Seconds"

class GenerateVoiceRequest(BaseModel):
    text: str
    audio_prompt_url: str = None

class ProjectCreate(BaseModel):
    title: str
    description: str = None
    platform: str = "YouTube"
    color_code: str = "#000000"
    emoji: str = "VP"

class PresignedUrlRequest(BaseModel):
    filename: str
    file_type: str

# --- PROJECT ENDPOINTS ---

@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Fetches projects belonging to the authenticated user."""
    return db.query(Project).filter(Project.owner_id == user_id).all()

@app.post("/api/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Creates a new project for the authenticated user."""
    db_project = Project(**project.dict(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Fetches full project details including associated tasks."""
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not project: 
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    return {"id": project.id, "title": project.title, "tasks": project.tasks}

@app.put("/api/projects/{project_id}")
def update_project(project_id: int, project_update: ProjectCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Updates existing project metadata."""
    db_project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    
    for key, value in project_update.dict().items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Deletes a project and all associated tasks."""
    db_project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    
    db.delete(db_project)
    db.commit()
    return {"status": "deleted"}

# --- ASSET & AI ENDPOINTS ---

@app.post("/api/upload/presigned")
async def get_presigned_url(request: PresignedUrlRequest):
    """Generates an S3 presigned URL for secure frontend-to-S3 uploads."""
    try:
        file_ext = request.filename.split(".")[-1] if "." in request.filename else "tmp"
        s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"
        presigned_data = s3_utils.generate_presigned_post(s3_key, request.file_type)
        if not presigned_data:
            raise HTTPException(status_code=500, detail="Failed to generate presigned URL")
        return {"url": presigned_data['url'], "fields": presigned_data['fields'], "path": s3_key}
    except Exception as e:
        logger.error(f"Presigned URL Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_script")
def generate_script(request: GenerateScriptRequest):
    """Uses the AI ideation engine to generate a video script."""
    try:
        idea = ideation_engine.generate_idea(topic=request.topic, duration=request.duration)
        return {"script": idea["text"], "hook": idea["hook"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_image")
async def ai_generate_image(request: dict = Body(...), user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Generates an AI image (Flux) and deducts 1 credit."""
    # 1. Credit Check
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.credits < 1:
        raise HTTPException(status_code=403, detail="Insufficient credits. Please top up.")

    try:
        prompt = request.get("prompt")
        image_bytes = generate_flux_image(prompt)
        s3_key = f"generated/{user_id}/{uuid.uuid4()}.png"
        s3_utils.upload_file_to_s3(image_bytes, s3_key, "image/png")
        
        # 2. Credit Deduction
        user.credits -= 1
        db.commit()
        
        return {"url": s3_utils.generate_signed_url(s3_key), "remaining_credits": user.credits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- VIDEO TASK ENDPOINTS ---

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Checks the progress or result of a video generation task."""
    task = db.query(Task).join(Project).filter(Task.id == task_id, Project.owner_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    
    video_url = task.video_url
    if video_url and not video_url.startswith("/api/video/temp/"):
        video_url = s3_utils.generate_signed_url(video_url)

    return {
        "id": task.id,
        "status": task.status,
        "progress": task.progress, 
        "video_url": video_url, 
        "title": task.title,
        "script": task.script
    }

@app.post("/api/tasks/generate")
def create_task(request: TaskCreateRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Queues a video generation task and deducts 5 credits."""
    # 1. Credit Check (Video generation is expensive, costing 5 credits)
    user = db.query(User).filter(User.id == user_id).first()
    cost = 5
    if not user or user.credits < cost:
        raise HTTPException(status_code=403, detail=f"Insufficient credits. This action requires {cost} credits.")

    # 2. Create the task record
    new_task = Task(
        **request.dict(exclude={'scripts'}), 
        script=request.scripts,
        status="Processing",
        progress=0
    )
    db.add(new_task)
    
    # 3. Credit Deduction
    user.credits -= cost
    db.commit()
    db.refresh(new_task)
    
    # 4. Trigger Worker
    task_payload = request.dict(by_alias=True)
    task_payload['id'] = new_task.id 
    generate_video_task.delay(task_payload)
    
    return {"status": "queued", "task_id": new_task.id, "remaining_credits": user.credits}

# --- LOCAL FILE STREAMING (FFMPEG DEBUGGING) ---
@app.get("/api/video/temp/{filename}")
async def stream_temp_file(filename: str):
    """Streams files from the local runtime dir for real-time previewing."""
    file_path = os.path.join(RUNTIME_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    media_type = "audio/wav" if filename.endswith(".wav") else "video/mp4"
    return FileResponse(file_path, media_type=media_type)