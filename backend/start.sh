#!/bin/bash

if [ "$PROCESS_TYPE" = "worker" ]; then
    echo "Starting Celery Worker..."
    # Points to the celery_app inside the worker directory 
    celery -A worker.celery_app worker --loglevel=info
else
    echo "Starting FastAPI Web Server..."
    # Points to the FastAPI app in app/main.py
    uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
