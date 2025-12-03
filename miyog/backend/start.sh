#!/bin/bash

if [ "$PROCESS_TYPE" = "worker" ]; then
    echo "Starting Celery Worker..."
    celery -A worker.celery_app worker --loglevel=info
else
    echo "Starting FastAPI Server..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
