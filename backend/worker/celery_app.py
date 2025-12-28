from celery import Celery 
from app.config import settings
from app.config import DATABASE_URL # <--- NEW: Import DATABASE_URL from config 

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    # Use the variable from settings, which grabs the correct 'db+postgresql://' string from Beanstalk
    backend=settings.CELERY_RESULT_BACKEND, 
    include=['worker.tasks']
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",   
    timezone="UTC",
    enable_utc=True,
    # SQS-specific configuration
    broker_transport_options={
        'visibility_timeout': 3600, # Set long timeout (1 hour) for heavy video tasks
    },
    # Best practices for memory-heavy workers (FFmpeg, Whisper)
    worker_max_tasks_per_child=1, # CRITICAL: Forces worker cleanup after each task
    task_acks_late=True, # Acknowledge task only after job fully completes

)





