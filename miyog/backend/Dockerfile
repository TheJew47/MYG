FROM python:3.10-slim

# 1. INSTALL THE MAGIC ADAPTER (This fixes the "Internal Server Error")
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

# 2. System Dependencies
RUN apt-get update && apt-get install -y \
    imagemagick ffmpeg libsm6 libxext6 fonts-liberation findutils \
    espeak-ng libsndfile1 libpq-dev build-essential && rm -rf /var/lib/apt/lists/*

RUN find /etc -name "policy.xml" -exec sh -c 'echo "<policymap><policy domain=\"coder\" rights=\"read|write\" pattern=\"PDF\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"LABEL\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"GHOSTSCRIPT\" /></policymap>" > {}' \;

WORKDIR /code

# 3. Install Dependencies (Optimized)
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
COPY ./requirements.txt /code/requirements.txt
RUN sed -i '/torch/d' /code/requirements.txt
RUN pip install --no-cache-dir scipy numpy spacy
RUN pip install --no-cache-dir -r /code/requirements.txt

# 4. Copy Code & Start
COPY . /code
# We use port 8080 because that is what the Adapter expects
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

# Trigger build
