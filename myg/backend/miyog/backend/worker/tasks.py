from worker.celery_app import celery_app
from app.engine.pipeline import run_pipeline
from app.models import Task
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging
from app.config import DATABASE_URL # <--- NEW: Imports PostgreSQL URL

logger = logging.getLogger(__name__)

# Database Setup (UPDATED FOR POSTGRESQL)
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@celery_app.task(name="tasks.generate_video")
def generate_video_task(task_data: dict):
    logger.info(f"Worker received task: {task_data.get('title')}")
    
    # Each task gets its own DB session
    db = SessionLocal()
    task_id = task_data['id']
    
    # Helper function to update progress in DB
    def update_progress(p: int):
        try:
            # Re-query to ensure session validity
            t = db.query(Task).filter(Task.id == task_id).first()
            if t:
                t.progress = p
                db.commit()
        except Exception as e:
            logger.error(f"Failed to update progress: {e}")

    try:
        update_progress(5) # Start
        
        # Pass callback to pipeline
        # The pipeline returns a dict including the S3 Key and script used
        result = run_pipeline(task_data, progress_callback=update_progress)
        
        update_progress(100) # Done
        
        task_record = db.query(Task).filter(Task.id == task_id).first()
        if task_record:
            task_record.status = "Completed"
            task_record.video_url = result['video_url'] # <--- This is now the S3 KEY
            db.commit()
            
        return {"status": "success", "result": result}

    except Exception as e:
        logger.error(f"Task failed: {e}")
        task_record = db.query(Task).filter(Task.id == task_id).first()
        if task_record:
            task_record.status = "Failed"
            db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()