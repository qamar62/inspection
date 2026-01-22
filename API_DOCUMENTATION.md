# API Documentation Guide

## Overview

The Inspection SaaS API is now documented using **drf-spectacular**, which provides:
- **OpenAPI 3.0** schema
- **Swagger UI** - Interactive API explorer
- **ReDoc** - Beautiful API documentation

## Accessing API Documentation

### 1. Swagger UI (Interactive)
```
http://localhost:8000/api/docs/
```

**Features:**
- ✅ Try out API endpoints directly in the browser
- ✅ See request/response examples
- ✅ Test authentication with JWT tokens
- ✅ Filter endpoints by tags
- ✅ Deep linking to specific operations

**How to use:**
1. Click "Authorize" button
2. Get JWT token from `/api/token/` endpoint
3. Enter: `Bearer YOUR_ACCESS_TOKEN`
4. Now you can test all authenticated endpoints

### 2. ReDoc (Read-only Documentation)
```
http://localhost:8000/api/redoc/
```

**Features:**
- ✅ Clean, professional documentation
- ✅ Three-panel layout
- ✅ Code samples in multiple languages
- ✅ Downloadable as HTML
- ✅ Search functionality

### 3. OpenAPI Schema (JSON)
```
http://localhost:8000/api/schema/
```

**Use cases:**
- Import into Postman
- Generate client SDKs
- API testing tools
- CI/CD integration

## API Endpoints Overview

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `GET /api/users/` - List users
- `GET /api/users/me/` - Get current user profile
- `GET /api/users/{id}/` - Get user details

### Clients
- `GET /api/clients/` - List clients
- `POST /api/clients/` - Create client
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client

### Equipment
- `GET /api/equipment/` - List equipment
- `POST /api/equipment/` - Create equipment
- `GET /api/equipment/{id}/` - Get equipment details
- `PUT /api/equipment/{id}/` - Update equipment
- `DELETE /api/equipment/{id}/` - Delete equipment

### Job Orders
- `GET /api/job-orders/` - List job orders
- `POST /api/job-orders/` - Create job order
- `GET /api/job-orders/{id}/` - Get job order details
- `PUT /api/job-orders/{id}/` - Update job order
- `POST /api/job-orders/{id}/assign/` - Assign inspector
- `POST /api/job-orders/{id}/publish/` - Publish job order

### Inspections
- `GET /api/inspections/` - List inspections
- `POST /api/inspections/` - Create inspection
- `GET /api/inspections/{id}/` - Get inspection details
- `PUT /api/inspections/{id}/` - Update inspection
- `POST /api/inspections/{id}/submit/` - Submit inspection
- `POST /api/inspections/{id}/approve/` - Approve inspection
- `POST /api/inspections/{id}/reject/` - Reject inspection

### Certificates
- `GET /api/certificates/` - List certificates
- `GET /api/certificates/{id}/` - Get certificate details
- `POST /api/certificates/{id}/generate/` - Generate certificate PDF
- `GET /api/certificates/public/?token=xxx` - Public certificate view

### Stickers
- `GET /api/stickers/` - List stickers
- `POST /api/stickers/` - Create sticker
- `GET /api/stickers/{code}/resolve/` - Resolve sticker to equipment

### Tools & Calibration
- `GET /api/tools/` - List tools
- `POST /api/tools/` - Create tool
- `GET /api/calibrations/` - List calibrations
- `POST /api/calibrations/` - Create calibration record

### Reports
- `GET /api/field-inspection-reports/` - List FIRs
- `POST /api/field-inspection-reports/` - Create FIR

## Authentication Flow

### 1. Obtain Token
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Use Token in Requests
```bash
curl http://localhost:8000/api/job-orders/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token (when expired)
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

## Request/Response Examples

### Create Job Order
```bash
POST /api/job-orders/
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "client": 1,
  "po_reference": "PO-2025-001",
  "site_location": "ABC Manufacturing, Sharjah",
  "scheduled_start": "2025-10-15T09:00:00Z",
  "scheduled_end": "2025-10-15T17:00:00Z",
  "notes": "Annual inspection",
  "line_items": [
    {
      "type": "Annual Inspection",
      "description": "Overhead crane inspection",
      "quantity": 1,
      "equipment": 1
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "po_reference": "PO-2025-001",
  "client": 1,
  "client_name": "ABC Manufacturing Ltd",
  "status": "DRAFT",
  "site_location": "ABC Manufacturing, Sharjah",
  "scheduled_start": "2025-10-15T09:00:00Z",
  "scheduled_end": "2025-10-15T17:00:00Z",
  "line_items": [...],
  "created_at": "2025-10-06T19:00:00Z"
}
```

### Submit Inspection
```bash
POST /api/inspections/{id}/submit/
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "answers": [
    {
      "question_key": "VISUAL_CONDITION",
      "result": "SAFE",
      "comment": "Equipment in good condition"
    },
    {
      "question_key": "LOAD_TEST",
      "result": "SAFE",
      "comment": "Load test passed at 110% SWL"
    }
  ],
  "inspector_signature": "base64_encoded_signature",
  "client_signature": "base64_encoded_signature"
}
```

## Filtering & Pagination

### Filtering
```bash
# Filter by status
GET /api/job-orders/?status=SCHEDULED

# Filter by client
GET /api/equipment/?client=1

# Filter by date range
GET /api/inspections/?start_time__gte=2025-10-01&start_time__lte=2025-10-31
```

### Search
```bash
# Search clients
GET /api/clients/?search=ABC

# Search equipment
GET /api/equipment/?search=crane
```

### Ordering
```bash
# Order by created date (descending)
GET /api/job-orders/?ordering=-created_at

# Order by name (ascending)
GET /api/clients/?ordering=name
```

### Pagination
```bash
# Get page 2 with 50 items per page
GET /api/job-orders/?page=2&page_size=50
```

**Response:**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/job-orders/?page=3",
  "previous": "http://localhost:8000/api/job-orders/?page=1",
  "results": [...]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid data",
  "errors": {
    "po_reference": ["This field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Postman Collection

### Import OpenAPI Schema
1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:8000/api/schema/`
4. Click "Import"
5. All endpoints will be added to your collection

### Setup Environment
Create a Postman environment with:
```
BASE_URL: http://localhost:8000
ACCESS_TOKEN: (will be set after login)
```

## Code Generation

### Generate Python Client
```bash
# Install openapi-generator
npm install @openapitools/openapi-generator-cli -g

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:8000/api/schema/ \
  -g python \
  -o ./python-client
```

### Generate TypeScript Client
```bash
openapi-generator-cli generate \
  -i http://localhost:8000/api/schema/ \
  -g typescript-axios \
  -o ./typescript-client
```

## Testing API

### Using curl
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access')

# Use token
curl http://localhost:8000/api/job-orders/ \
  -H "Authorization: Bearer $TOKEN"
```

### Using httpie
```bash
# Install httpie
pip install httpie

# Get token
http POST http://localhost:8000/api/token/ username=admin password=admin123

# Use token
http GET http://localhost:8000/api/job-orders/ "Authorization: Bearer YOUR_TOKEN"
```

### Using Python requests
```python
import requests

# Get token
response = requests.post('http://localhost:8000/api/token/', json={
    'username': 'admin',
    'password': 'admin123'
})
token = response.json()['access']

# Use token
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/job-orders/', headers=headers)
job_orders = response.json()
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:
- django-ratelimit
- django-throttle
- API Gateway rate limiting

## Webhooks

Webhooks are not yet implemented but planned for:
- Inspection completed
- Certificate generated
- Approval status changed
- Equipment due for inspection

## API Versioning

Current version: **v1**

Future versions will be available at:
- `/api/v2/...`
- `/api/v3/...`

## Support

For API support:
- Email: support@timesunited.com
- Documentation: http://localhost:8000/api/docs/
- Schema: http://localhost:8000/api/schema/

---

**Last Updated:** October 6, 2025
**API Version:** 1.0.0
**Django Version:** 5.2+
**DRF Version:** 3.15+
