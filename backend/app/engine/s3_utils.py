# miyog/backend/app/engine/s3_utils.py
import boto3
import os
from app.config import settings
from fastapi import HTTPException
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# --- 1. S3 Client Initialization ---
def get_s3_client():
    """
    Initializes the Boto3 S3 client using credentials from settings.
    boto3 automatically uses IAM roles in AWS environments if keys are None.
    """
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        region_name=settings.AWS_REGION
    )

# --- 2. File Upload Function (Server-Side) ---
def upload_file_to_s3(file_content: bytes, file_key: str, content_type: str):
    """
    Used for server-side generated content (like AI images/videos).
    For user uploads, use generate_presigned_post instead.
    """
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key,
            Body=file_content,
            ContentType=content_type
        )
    except ClientError as e:
        logger.error(f"S3 Upload failed for {file_key}: {e}")
        raise HTTPException(status_code=500, detail=f"S3 Upload Failed: {str(e)}")
    return file_key

# --- 3. Presigned POST Generation (Client-Side Upload) ---
def generate_presigned_post(object_name: str, file_type: str, expiration: int = 3600):
    """
    Generates a presigned URL for a POST request.
    This allows the browser to upload files directly to S3, bypassing Vercel limits.
    """
    s3 = get_s3_client()
    try:
        response = s3.generate_presigned_post(
            Bucket=settings.S3_BUCKET_NAME,
            Key=object_name,
            Fields={"Content-Type": file_type},
            Conditions=[{"Content-Type": file_type}],
            ExpiresIn=expiration
        )
        return response
    except Exception as e:
        logger.error(f"S3 Presigned Post Error for {object_name}: {e}")
        return None

# --- 4. File Download Function (Used by Workers) ---
def download_file_from_s3(s3_key: str, local_path: str):
    s3 = get_s3_client()
    try:
        s3.download_file(
            settings.S3_BUCKET_NAME, 
            s3_key, 
            local_path
        )
        return local_path
    except Exception as e:
        logger.error(f"S3 Download failed for {s3_key}: {e}")
        raise RuntimeError(f"S3 Download failed for {s3_key}: {e}")

# --- 5. Secure URL Generation Function (GET/Streaming) ---
def generate_signed_url(s3_key: str, expiration: int = 3600):
    s3 = get_s3_client()
    if not s3_key: return None
    try:
        filename = os.path.basename(s3_key)
        # Generates a temporary link valid for 1 hour
        # Force "Attachment" disposition to trigger browser download
        return s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME, 
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{filename}"'
            },
            ExpiresIn=expiration
        )
    except Exception as e:
        logger.error(f"Error generating signed URL: {e}")
        return None
