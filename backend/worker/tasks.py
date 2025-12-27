# myg/backend/worker/tasks.py

import os
import logging
import asyncio
from celery import Celery
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL, settings
from app.models import Task
from app.engine import pipeline, nle_renderer

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery("worker", broker=settings.CELERY_BROKER_URL)

# Database Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@celery_app.task(name="worker.tasks.generate_video_task", bind=True)
def generate_video_task(self, payload: dict):
    """
    The central task router. 
    It determines whether to run the automated AI pipeline or render a manual NLE timeline.
    """
    task_id = payload.get("id")
    db = SessionLocal()
    task = None
    
    try:
        # 1. Fetch the task from the database
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            logger.error(f"Task {task_id} not found.")
            return "Task not found"

        # 2. Define the progress callback for both paths
        def progress_callback(p):
            # Update Celery state for frontend polling
            self.update_state(state='PROGRESS', meta={'progress': p})
            
            # Determine status message based on the processing path
            if payload.get("timeline"):
                # Manual NLE Path Status
                if p < 50: status = "Downloading Assets"
                elif p < 90: status = "Rendering Timeline"
                else: status = "Finalizing"
            else:
                # AI Pipeline Path Status
                if p < 25: status = "Generating Script/Voice"
                elif p < 50: status = "Transcribing Audio"
                elif p < 100: status = "Optimizing Visuals"
                else: status = "Completed"
            
            task.progress = p
            task.status = status
            db.commit()

        # 3. Routing Logic
        logger.info(f"🚀 Starting Task {task_id}")

        if payload.get("timeline"):
            # --- PATH A: MANUAL NLE EDITOR EXPORT ---
            logger.info(f"Routing to NLE Renderer (Manual Edit Detected)")
            
            # nle_renderer.process_nle_task is an async function
            result = asyncio.run(nle_renderer.process_nle_task(payload, progress_callback))
        
        else:
            # --- PATH B: STANDALONE AI PIPELINE ---
            logger.info(f"Routing to Standalone AI Pipeline")
            
            # Extract voice prompt reference from payload if it exists
            files = payload.get("files", {})
            voice_prompt = files.get("Audio Track") if isinstance(files, dict) else None

            # Prepare task data for the AI pipeline engine
            task_data = {
                "title": task.title,
                "scripts": task.script,
                "voice_url": voice_prompt,
                "resolution": payload.get("resolution", "1080x1920"),
                "fps": payload.get("fps", 24)
            }
            
            result = pipeline.run_pipeline(task_data, progress_callback)

        # 4. Finalize Task Record
        task.video_url = result.get("video_url") or result.get("audio_url")
        task.status = "Completed"
        task.progress = 100
        db.commit()
        
        logger.info(f"✅ Task {task_id} Successfully Completed")
        return result

    except Exception as e:
        logger.error(f"❌ Task {task_id} Failed: {str(e)}")
        if task:
            task.status = f"Error: {str(e)[:100]}"
            db.commit()
        raise e
    finally:
        db.close()