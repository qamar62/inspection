# Company Branding Complete! ✅

## What Was Done

### 1. Django Admin Customization
**File:** `backend/inspections/admin.py`

```python
admin.site.site_header = "Times United Backend"
admin.site.site_title = "Times United Admin"
admin.site.index_title = "Inspection Division Management"
```

**Result:**
- Browser tab title: "Times United Admin"
- Admin header: "Times United Backend"
- Dashboard title: "Inspection Division Management"

### 2. Company Constants in Settings
**File:** `backend/inspection_backend/settings.py`

```python
COMPANY_NAME = 'Times United'
COMPANY_FULL_NAME = 'Times United Verifications & Inspections'
COMPANY_DIVISION = 'Inspection Division'
```

**Usage:** Available throughout the application

### 3. Context Processor
**File:** `backend/inspections/context_processors.py`

Makes company info available in all templates automatically:
- `{{ COMPANY_NAME }}`
- `{{ COMPANY_FULL_NAME }}`
- `{{ COMPANY_DIVISION }}`

### 4. Updated Certificate Template
**File:** `backend/inspections/templates/certificate.html`

Now uses dynamic company name:
```html
<div class="company-name">{{ company_name|upper }}</div>
<div class="company-tagline">{{ company_division }}</div>
```

### 5. Updated Certificate Generation Task
**File:** `backend/inspections/tasks.py`

Passes company info to template context:
```python
context = {
    ...
    'company_name': settings.COMPANY_NAME,
    'company_full_name': settings.COMPANY_FULL_NAME,
    'company_division': settings.COMPANY_DIVISION,
}
```

## Where Company Name Appears

### Django Admin
- ✅ Browser tab: "Times United Admin"
- ✅ Header: "Times United Backend"
- ✅ Dashboard: "Inspection Division Management"

### Certificates (PDF)
- ✅ Letterhead: "TIMES UNITED"
- ✅ Tagline: "Inspection Division"
- ✅ Footer: "Times United Verifications & Inspections"

### API Documentation
- ✅ Title: "Inspection SaaS API"
- ✅ Description: "Times United Verifications & Inspections Division"
- ✅ Contact: "Times United Inspections"

### Email Templates (Future)
- ✅ From: "Times United Inspections"
- ✅ Signature: Company name
- ✅ Footer: Company info

## How to Use Company Name

### In Python Code
```python
from django.conf import settings

company = settings.COMPANY_NAME  # "Times United"
full_name = settings.COMPANY_FULL_NAME  # "Times United Verifications & Inspections"
division = settings.COMPANY_DIVISION  # "Inspection Division"
```

### In Django Templates
```html
<!-- Automatically available via context processor -->
<h1>{{ COMPANY_NAME }}</h1>
<p>{{ COMPANY_FULL_NAME }}</p>
<p>{{ COMPANY_DIVISION }}</p>
```

### In Celery Tasks
```python
from django.conf import settings

def my_task():
    company = settings.COMPANY_NAME
    # Use in emails, PDFs, etc.
```

### In Serializers/Views
```python
from django.conf import settings

class MyView(APIView):
    def get(self, request):
        return Response({
            'company': settings.COMPANY_NAME
        })
```

## Customization

To change company branding, edit one place:

**File:** `backend/inspection_backend/settings.py`

```python
# Application specific settings
COMPANY_NAME = 'Your Company'
COMPANY_FULL_NAME = 'Your Company Full Name'
COMPANY_DIVISION = 'Your Division'
```

All templates, emails, PDFs, and admin will update automatically!

## Testing

### 1. Check Django Admin
```bash
# Access admin
http://localhost:8000/admin

# Login: admin / admin123
# Check browser tab and header
```

### 2. Generate Certificate
```bash
# Generate sample data
docker compose exec backend python manage.py generate_sample_data

# Generate certificate via API or admin
# Check PDF letterhead
```

### 3. Check API Docs
```bash
# Access Swagger
http://localhost:8000/api/docs/

# Check title and description
```

## Benefits

✅ **Centralized Branding** - Change once, updates everywhere
✅ **Professional Look** - Consistent company name across all outputs
✅ **Easy Maintenance** - No hardcoded strings scattered in code
✅ **White Label Ready** - Easy to rebrand for different clients
✅ **Template Friendly** - Available in all Django templates

## Future Enhancements

Can add more company info:
```python
COMPANY_ADDRESS = 'Your Address'
COMPANY_PHONE = '+971-XX-XXX-XXXX'
COMPANY_EMAIL = 'info@timesunited.com'
COMPANY_WEBSITE = 'https://timesunited.com'
COMPANY_LOGO_URL = '/static/images/logo.png'
COMPANY_LICENSE = 'ISO/IEC 17020 Accredited'
```

---

**Status:** Complete! ✅
**Company Name:** Times United
**Division:** Inspection Division
**Branding:** Consistent across all platforms
