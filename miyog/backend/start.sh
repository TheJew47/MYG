#!/bin/bash

if [ "$PROCESS_TYPE" = "worker" ]; then
    echo "Starting Celery Worker..."
    # Run Celery. Ensure --loglevel is set to info or debug
    celery -A celery_app worker --loglevel=info
else
    echo "Starting FastAPI Web Server..."
    # Run Uvicorn on port 8000 (Beanstalk maps 80 -> 8000 usually)
    uvicorn main:app --host 0.0.0.0 --port 8000
fi
