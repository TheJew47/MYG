FROM python:3.10-slim

# 1. System Dependencies (Same as before, required for Video/Audio)
RUN apt-get update && apt-get install -y \
    imagemagick ffmpeg libsm6 libxext6 fonts-liberation findutils \
    espeak-ng libsndfile1 libpq-dev build-essential && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick Policy
RUN find /etc -name "policy.xml" -exec sh -c 'echo "<policymap><policy domain=\"coder\" rights=\"read|write\" pattern=\"PDF\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"LABEL\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"GHOSTSCRIPT\" /></policymap>" > {}' \;

WORKDIR /code

# 2. Install Dependencies
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
COPY ./requirements.txt /code/requirements.txt
RUN sed -i '/torch/d' /code/requirements.txt
RUN pip install --no-cache-dir scipy numpy spacy
RUN pip install --no-cache-dir -r /code/requirements.txt

# 3. Copy Code
COPY . /code

# 4. Start Command (Standard Web Server)
# Beanstalk looks for exposure on Port 8000 by default for Python
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
