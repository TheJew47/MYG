FROM python:3.10-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

RUN apt-get update && apt-get install -y \
    imagemagick ffmpeg libsm6 libxext6 fonts-liberation findutils \
    espeak-ng libsndfile1 libpq-dev build-essential && rm -rf /var/lib/apt/lists/*

RUN find /etc -name "policy.xml" -exec sh -c 'echo "<policymap><policy domain=\"coder\" rights=\"read|write\" pattern=\"PDF\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"LABEL\" /><policy domain=\"coder\" rights=\"read|write\" pattern=\"GHOSTSCRIPT\" /></policymap>" > {}' \;

WORKDIR /code

# Install python dependencies (Optimized)
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
COPY ./requirements.txt /code/requirements.txt
RUN sed -i '/torch/d' /code/requirements.txt
RUN pip install --no-cache-dir scipy numpy spacy
RUN pip install --no-cache-dir -r /code/requirements.txt

COPY . /code
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
