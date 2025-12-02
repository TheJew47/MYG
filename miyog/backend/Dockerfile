# 1. Base Image: Use a version that supports Python 3.10 and FFmpeg dependencies
FROM python:3.10-slim

# 2. Install System Dependencies (FFmpeg, ImageMagick, Kokoro/SoundFile dependencies)
RUN apt-get update && apt-get install -y \
    imagemagick \
    ffmpeg \
    libsm6 \
    libxext6 \
    fonts-liberation \
    findutils \
    espeak-ng \
    libsndfile1 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Fix ImageMagick Policy (DYNAMIC OVERWRITE - remains critical for MoviePy)
RUN find /etc -name "policy.xml" -exec sh -c 'echo "<policymap><policy domain=\"coder\" rights=\"read|write\" pattern=\"PDF\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"LABEL\" /><policy domain=\"path\" rights=\"read|write\" pattern=\"@*\" /></policymap>" > {}' \;

# 4. Working Directory
WORKDIR /code

# 5. Install Python Dependencies
# We include psycopg2 and boto3, which require libpq-dev (installed above)
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# 6. Copy App Code (Backend + Worker)
COPY ./app /code/app
COPY ./worker /code/worker

# 7. Worker Start Command (Celery Entrypoint)
# This is the command that the EC2 instance will run
CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=INFO"]