# MinIO Integration Guide

## What Was Configured

### 1. **Django Settings** (`backend/inspection_backend/settings.py`)
- ✅ Added MinIO/S3 storage configuration
- ✅ Configured `django-storages` to use S3-compatible storage
- ✅ Set up public read access for files
- ✅ Configured media file handling

### 2. **Docker Compose** (`docker-compose.yml`)
- ✅ Added MinIO environment variables to backend
- ✅ Added MinIO environment variables to celery_worker
- ✅ Added MinIO as dependency

### 3. **Environment Variables** (`.env.example`)
- ✅ Updated with MinIO configuration
- ✅ Bucket name: `inspection-files`
- ✅ Endpoint: `http://minio:9000`
- ✅ Credentials: `minioadmin` / `minioadmin`

## How to Use

### Step 1: Initialize MinIO Bucket

```bash
# Run the initialization script
docker compose exec backend python init_minio.py
```

This will:
- Create the `inspection-files` bucket if it doesn't exist
- Set public read policy
- Test upload/download functionality

### Step 2: Restart Backend Services

```bash
# Restart to pick up new environment variables
docker compose restart backend celery_worker
```

### Step 3: Verify MinIO is Working

**Access MinIO Console:**
```
http://localhost:9001
Username: minioadmin
Password: minioadmin
```

**Check if bucket exists:**
- Navigate to "Buckets"
- You should see `inspection-files` bucket

### Step 4: Test File Upload

You can test file upload via Django admin or API:

**Via Django Admin:**
1. Go to http://localhost:8000/admin
2. Create a PhotoRef or upload a file
3. The file should be stored in MinIO

**Via API:**
```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access')

# Upload a photo (example)
curl -X POST http://localhost:8000/api/photos/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "description=Test photo"
```

## File Storage Structure

Files will be organized in MinIO as:

```
inspection-files/
├── photos/
│   ├── inspection_123_front.jpg
│   ├── inspection_123_side.jpg
│   └── ...
├── signatures/
│   ├── inspector_signature_456.png
│   ├── client_signature_456.png
│   └── ...
├── certificates/
│   ├── cert_789.pdf
│   └── ...
└── reports/
    ├── fir_101.pdf
    └── ...
```

## Accessing Files

### From Backend (Django)
```python
from django.core.files.base import ContentFile
from inspections.models import PhotoRef

# Upload file
photo = PhotoRef.objects.create(
    inspection_id=1,
    photo_type='FRONT',
    image=ContentFile(image_data, name='front.jpg')
)

# Access file URL
url = photo.image.url
# Returns: http://minio:9000/inspection-files/photos/front.jpg
```

### From Frontend (Browser)
Files are publicly accessible via:
```
http://localhost:9000/inspection-files/photos/front.jpg
```

### From Mobile App (Offline)
- Download files when online
- Store in IndexedDB/localForage
- Upload when back online

## Environment Variables

### Backend Container
```env
USE_S3=True
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_STORAGE_BUCKET_NAME=inspection-files
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_S3_REGION_NAME=us-east-1
AWS_S3_USE_SSL=False
AWS_S3_CUSTOM_DOMAIN=localhost:9000/inspection-files
```

## File Upload Endpoints

### 1. Photo Upload
```
POST /api/photos/
Content-Type: multipart/form-data

Fields:
- inspection: int (inspection ID)
- photo_type: string (FRONT, SIDE, REAR, HYDRAULICS, ENGINE, CABIN)
- image: file
- description: string (optional)
```

### 2. Signature Upload
```
POST /api/signatures/
Content-Type: multipart/form-data

Fields:
- inspection: int
- signature_type: string (INSPECTOR, CLIENT)
- signature_image: file
```

### 3. Certificate Upload (Auto-generated)
```
POST /api/certificates/{inspection_id}/generate/

Response:
{
  "id": 1,
  "pdf_file": "http://localhost:9000/inspection-files/certificates/cert_1.pdf",
  "qr_code": "CERT-2025-00000001"
}
```

## Troubleshooting

### Issue: Bucket not found
**Solution:**
```bash
docker compose exec backend python init_minio.py
```

### Issue: Permission denied
**Solution:**
Check MinIO console and ensure bucket policy is set to public read:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::inspection-files/*"]
    }
  ]
}
```

### Issue: Files not accessible from browser
**Solution:**
1. Check `AWS_S3_CUSTOM_DOMAIN` is set correctly
2. Ensure MinIO port 9000 is accessible
3. Check CORS settings in MinIO console

### Issue: Connection refused
**Solution:**
```bash
# Check if MinIO is running
docker compose ps minio

# Check MinIO logs
docker compose logs minio

# Restart MinIO
docker compose restart minio
```

## Production Considerations

### 1. Change Default Credentials
```env
AWS_ACCESS_KEY_ID=your-secure-access-key
AWS_SECRET_ACCESS_KEY=your-secure-secret-key
```

### 2. Enable SSL
```env
AWS_S3_USE_SSL=True
AWS_S3_ENDPOINT_URL=https://minio.yourdomain.com
```

### 3. Set up CDN
Use CloudFront or similar CDN in front of MinIO for better performance.

### 4. Backup Strategy
- Set up MinIO replication
- Regular bucket backups
- Versioning enabled

### 5. Access Control
- Use IAM policies
- Restrict public access to specific paths
- Implement signed URLs for sensitive files

## Next Steps

1. ✅ MinIO configured and running
2. ⏳ Implement photo upload in inspection execution page
3. ⏳ Implement signature capture and upload
4. ⏳ Implement certificate PDF generation and storage
5. ⏳ Add file download functionality in frontend
6. ⏳ Implement offline file caching

---

**MinIO Integration Complete!** 🎉

Files will now be stored in MinIO instead of local filesystem, making the system scalable and production-ready.
