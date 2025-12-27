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
import logging

from app.models import Base, Project, Task, User
from app.auth import get_current_user_id
from worker.tasks import generate_video_task
from app.schemas.task_schema import TaskCreateRequest, CaptionSettings
from app.engine import ideation as ideation_engine
from app.engine import voice as voice_engine
from app.engine import assets as assets_engine
from app.engine import s3_utils 
from app.engine.huggingface import generate_flux_image, generate_ltx_video
from app.config import DATABASE_URL, settings 

# Setup Logging
logger = logging.getLogger(__name__)

# Setup DB 
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine) 

app = FastAPI(title="Miyog Engine")

# FIXED: Specify exact origins because allow_credentials is True. 
# Added your Vercel URL as requested.
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

# SHARED DIRECTORIES
RUNTIME_DIR = "/tmp/loom_runtime" 
os.makedirs(RUNTIME_DIR, exist_ok=True) 

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

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

class AudioPreviewRequest(BaseModel):
    text: str
    voice: str
    speed: float = 1.0

class ImageGenRequest(BaseModel):
    prompt: str

class VideoGenRequest(BaseModel):
    prompt: str

class PresignedUrlRequest(BaseModel):
    filename: str
    file_type: str

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

@app.put("/api/projects/{project_id}")
def update_project(project_id: int, project_update: ProjectCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in project_update.dict().items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"status": "deleted"}

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user_id).first()
    if not project: 
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": project.id, "title": project.title, "tasks": project.tasks}

@app.post("/api/upload/presigned")
async def get_presigned_url(request: PresignedUrlRequest):
    """
    Generates a temporary S3 URL so the frontend can upload directly,
    bypassing Vercel's 4.5MB limit.
    """
    try:
        file_ext = request.filename.split(".")[-1] if "." in request.filename else "tmp"
        s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"
        
        # Generate the POST handshake
        presigned_data = s3_utils.generate_presigned_post(
            s3_key, 
            request.file_type
        )
        
        if not presigned_data:
            raise HTTPException(status_code=500, detail="Failed to generate presigned URL")
            
        return {
            "url": presigned_data['url'],
            "fields": presigned_data['fields'],
            "path": s3_key
        }
    except Exception as e:
        logger.error(f"Presigned URL Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/api/ai/generate_script")
def generate_script(request: GenerateScriptRequest):
    try:
        idea = ideation_engine.generate_idea(topic=request.topic, duration=request.duration)
        return {"script": idea["text"], "hook": idea["hook"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_voice")
async def generate_voice(request: GenerateVoiceRequest):
    try:
        s3_key = voice_engine.generate_voice(request.text, request.audio_prompt_url)
        return {"url": s3_utils.generate_signed_url(s3_key)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_image")
async def ai_generate_image(request: ImageGenRequest):
    try:
        image_bytes = generate_flux_image(request.prompt)
        s3_key = f"generated/public/{uuid.uuid4()}.png"
        s3_utils.upload_file_to_s3(image_bytes, s3_key, "image/png")
        signed_url = s3_utils.generate_signed_url(s3_key)
        return {"url": signed_url}
    except Exception as e:
        print(f"IMAGE GEN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate_video")
async def ai_generate_video(request: VideoGenRequest):
    try:
        video_bytes = generate_ltx_video(request.prompt)
        s3_key = f"generated/public/{uuid.uuid4()}.mp4"
        s3_utils.upload_file_to_s3(video_bytes, s3_key, "video/mp4")
        signed_url = s3_utils.generate_signed_url(s3_key)
        return {"url": signed_url}
    except Exception as e:
        print(f"VIDEO GEN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ASSET SEARCH ---
@app.get("/api/assets/search")
async def search_assets(q: str, page: int = 1):
    return await assets_engine.search_pixabay(q, page)

# --- STREAMING ---
@app.get("/api/video/temp/{filename}")
async def stream_temp_file(filename: str):
    file_path = os.path.join(RUNTIME_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Temporary file not found")
    
    media_type = "audio/wav" if filename.endswith(".wav") else "video/mp4"
    return FileResponse(file_path, media_type=media_type)


@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
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
        "generate_video": task.generate_video,
        "generate_audio": task.generate_audio,
        "generate_script": task.generate_script
    }

@app.post("/api/tasks/generate")
def create_task(request: TaskCreateRequest, db: Session = Depends(get_db)):
    new_task = Task(
        title=request.title or "New AI Video",
        description=request.description,
        script=request.scripts,
        status="Processing",
        resolution=request.resolution,
        project_id=request.project_id,
        progress=0,
        generate_script=request.generate_script,
        generate_audio=request.generate_audio,
        generate_images=request.generate_images,
        generate_video=request.generate_video,
        vignette_intensity=request.vignette_intensity
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    task_payload = request.dict(by_alias=True)
    task_payload['id'] = new_task.id 
    
    generate_video_task.delay(task_payload)
    
    return {"status": "queued", "task_id": new_task.id}
