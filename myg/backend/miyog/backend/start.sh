#!/bin/bash

if [ "$PROCESS_TYPE" = "worker" ]; then
    echo "Starting Celery Worker..."
    # FIX: Changed 'celery_app' to 'worker.celery_app'
    celery -A worker.celery_app worker --loglevel=info
else
    echo "Starting FastAPI Web Server..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
