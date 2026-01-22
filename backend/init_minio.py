"""
Initialize MinIO bucket for file storage
Run this script to create the bucket if it doesn't exist
"""

import boto3
from botocore.client import Config
import os

def init_minio():
    """Initialize MinIO bucket"""
    
    # MinIO connection settings
    endpoint_url = os.getenv('AWS_S3_ENDPOINT_URL', 'http://minio:9000')
    access_key = os.getenv('AWS_ACCESS_KEY_ID', 'minioadmin')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'minioadmin')
    bucket_name = os.getenv('AWS_STORAGE_BUCKET_NAME', 'inspection-files')
    
    print(f"Connecting to MinIO at {endpoint_url}...")
    
    # Create S3 client
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )
    
    try:
        # Check if bucket exists
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"✓ Bucket '{bucket_name}' already exists")
    except:
        # Create bucket if it doesn't exist
        try:
            s3_client.create_bucket(Bucket=bucket_name)
            print(f"✓ Created bucket '{bucket_name}'")
            
            # Set bucket policy to public read
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicRead",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                    }
                ]
            }
            
            import json
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
            print(f"✓ Set public read policy on bucket '{bucket_name}'")
            
        except Exception as e:
            print(f"✗ Error creating bucket: {e}")
            return False
    
    # Test upload
    try:
        test_key = 'test.txt'
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=b'MinIO is working!',
            ContentType='text/plain'
        )
        print(f"✓ Test file uploaded successfully")
        
        # Delete test file
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        print(f"✓ Test file deleted")
        
    except Exception as e:
        print(f"✗ Error testing upload: {e}")
        return False
    
    print("\n✓ MinIO initialization complete!")
    print(f"Bucket: {bucket_name}")
    print(f"Endpoint: {endpoint_url}")
    print(f"Access via: http://localhost:9000/{bucket_name}/")
    
    return True

if __name__ == '__main__':
    init_minio()
