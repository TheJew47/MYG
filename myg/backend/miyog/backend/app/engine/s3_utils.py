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
    # boto3 automatically uses IAM roles in AWS environments
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        region_name=settings.AWS_REGION
    )

# --- 2. File Upload Function ---
def upload_file_to_s3(file_content: bytes, file_key: str, content_type: str):
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
        raise HTTPException(status_code=500, detail=f"S3 Upload Failed. Check IAM role permissions: {str(e)}")
    return file_key

# --- 3. File Download Function (Used by Workers) ---
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
        raise RuntimeError(f"S3 Download failed for {s3_key}: {e}")

# --- 4. Secure URL Generation Function (FIXED FOR DOWNLOAD) ---
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