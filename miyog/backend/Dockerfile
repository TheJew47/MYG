FROM python:3.10-slim

# 1. System Dependencies
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

# 3. Copy Code & Script
COPY . /code

# 4. Make script executable
RUN chmod +x /code/start.sh

# 5. Start Command (Uses the script to decide what to run)
EXPOSE 8000
CMD ["/code/start.sh"]

#TRIGGER
