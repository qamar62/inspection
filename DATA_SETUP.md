# Test Data Setup Guide

This guide will help you create test data in the Django admin to test the frontend functionality.

## Access Django Admin

1. **Make sure Docker containers are running:**
   ```bash
   docker compose up
   ```

2. **Access Django Admin:**
   - URL: http://localhost:8000/admin
   - Username: `admin`
   - Password: `admin123`

## Step-by-Step Data Creation

### 1. Create Additional Users

**Navigate to:** Users → Add User

Create the following users for testing different roles:

**Inspector User:**
- Username: `inspector1`
- Password: `inspector123`
- First name: `John`
- Last name: `Inspector`
- Email: `inspector@test.com`
- Role: `INSPECTOR`
- Competence: `Crane inspection certified, 5 years experience`

**Technical Manager:**
- Username: `manager1`
- Password: `manager123`
- First name: `Sarah`
- Last name: `Manager`
- Email: `manager@test.com`
- Role: `TECHNICAL_MANAGER`

**Client User:**
- Username: `client1`
- Password: `client123`
- First name: `Mike`
- Last name: `Client`
- Email: `client@test.com`
- Role: `CLIENT`

### 2. Create Clients

**Navigate to:** Clients → Add Client

**Client 1:**
- Name: `ABC Manufacturing Ltd`
- Contact person: `Mike Johnson`
- Email: `mike@abcmfg.com`
- Phone: `+971-50-123-4567`
- Address: `Industrial Area 1, Sharjah, UAE`
- Billing reference: `ABC-2025`
- Is active: ✓

**Client 2:**
- Name: `XYZ Construction`
- Contact person: `Ahmed Ali`
- Email: `ahmed@xyzconstruction.com`
- Phone: `+971-50-987-6543`
- Address: `Dubai Investment Park, Dubai, UAE`
- Billing reference: `XYZ-2025`
- Is active: ✓

### 3. Create Equipment

**Navigate to:** Equipment → Add Equipment

**Equipment 1:**
- Client: `ABC Manufacturing Ltd`
- Tag code: `CR-001-2025`
- Type: `Overhead Crane`
- Manufacturer: `Konecranes`
- Model: `CXT-20`
- Serial number: `KCR-2024-5678`
- SWL: `20.00` (tons)
- Location: `Warehouse A, Bay 3`
- Next due: (Set to 30 days from today)

**Equipment 2:**
- Client: `ABC Manufacturing Ltd`
- Tag code: `HO-002-2025`
- Type: `Chain Hoist`
- Manufacturer: `Yale`
- Model: `CPV-5`
- Serial number: `YH-2024-1234`
- SWL: `5.00` (tons)
- Location: `Workshop B, Station 5`
- Next due: (Set to 15 days from today)

**Equipment 3:**
- Client: `XYZ Construction`
- Tag code: `CR-003-2025`
- Type: `Mobile Crane`
- Manufacturer: `Liebherr`
- Model: `LTM-1100`
- Serial number: `LH-2023-9876`
- SWL: `100.00` (tons)
- Location: `Construction Site - Tower 1`
- Next due: (Set to 45 days from today)

### 4. Create Job Orders

**Navigate to:** Job Orders → Add Job Order

**Job Order 1:**
- Client: `ABC Manufacturing Ltd`
- PO reference: `PO-2025-001`
- Status: `SCHEDULED`
- Site location: `ABC Manufacturing Ltd, Industrial Area 1, Sharjah`
- Scheduled start: (Set to tomorrow at 9:00 AM)
- Scheduled end: (Set to tomorrow at 5:00 PM)
- Notes: `Annual inspection for overhead crane and chain hoist`
- Created by: `admin`

**Job Order 2:**
- Client: `XYZ Construction`
- PO reference: `PO-2025-002`
- Status: `DRAFT`
- Site location: `XYZ Construction Site, Dubai Investment Park`
- Tentative date: (Set to next week)
- Notes: `Pre-operational inspection for mobile crane`
- Created by: `admin`

### 5. Create Job Line Items

**Navigate to:** Job Line Items → Add Job Line Item

**For Job Order 1 (ABC Manufacturing):**

**Line Item 1:**
- Job order: `JO-1 - ABC Manufacturing Ltd`
- Equipment: `CR-001-2025 - Overhead Crane`
- Type: `Annual Inspection`
- Description: `Complete inspection of overhead crane including load test`
- Quantity: `1`
- Status: `PENDING`

**Line Item 2:**
- Job order: `JO-1 - ABC Manufacturing Ltd`
- Equipment: `HO-002-2025 - Chain Hoist`
- Type: `Annual Inspection`
- Description: `Chain hoist inspection and load test`
- Quantity: `1`
- Status: `PENDING`

**For Job Order 2 (XYZ Construction):**

**Line Item 3:**
- Job order: `JO-2 - XYZ Construction`
- Equipment: `CR-003-2025 - Mobile Crane`
- Type: `Pre-operational Inspection`
- Description: `Mobile crane inspection before project start`
- Quantity: `1`
- Status: `PENDING`

### 6. Create Stickers (Optional)

**Navigate to:** Stickers → Add Sticker

**Sticker 1:**
- Sticker code: `TUVINSP-000001`
- QR payload: `https://inspection-saas.com/sticker/TUVINSP-000001`
- Status: `ASSIGNED`
- Assigned equipment: `CR-001-2025 - Overhead Crane`
- Assigned at: (Current date/time)
- Assigned by: `admin`

**Sticker 2:**
- Sticker code: `TUVINSP-000002`
- QR payload: `https://inspection-saas.com/sticker/TUVINSP-000002`
- Status: `ASSIGNED`
- Assigned equipment: `HO-002-2025 - Chain Hoist`
- Assigned at: (Current date/time)
- Assigned by: `admin`

## Testing the Frontend

After creating the test data, you can test the following workflows:

### 1. Login and View Dashboard
- Go to: http://localhost:3000
- Login with: `admin` / `admin123`
- You should see the dashboard with statistics

### 2. View Job Orders
- Navigate to: Job Orders
- You should see the 2 job orders you created
- Click on a job order to view details

### 3. Create a New Job Order
- Click "Create Job Order"
- Select a client
- Add site location and line items
- Submit the form

### 4. Assign Inspector
- Open a job order detail page
- Click "Assign Inspector"
- Select `inspector1`
- The system will create inspection records

### 5. View Equipment
- Navigate to: Equipment
- You should see all 3 equipment items
- Search functionality should work

### 6. View Clients
- Navigate to: Clients
- You should see both clients in card view

### 7. Test Different User Roles

**Login as Inspector:**
- Username: `inspector1` / `inspector123`
- Should only see assigned inspections
- Limited menu options

**Login as Manager:**
- Username: `manager1` / `manager123`
- Can approve/reject inspections
- Full access to reports

**Login as Client:**
- Username: `client1` / `client123`
- Read-only access
- Can only view published certificates

## API Testing

You can also test the API directly:

### Get Auth Token
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### List Job Orders
```bash
curl http://localhost:8000/api/job-orders/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### List Equipment
```bash
curl http://localhost:8000/api/equipment/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Quick Test Script

You can also use Django shell to create test data quickly:

```bash
docker compose exec backend python manage.py shell
```

Then run:
```python
from inspections.models import Client, Equipment, JobOrder, JobLineItem, User

# Create a client
client = Client.objects.create(
    name="Test Client",
    contact_person="John Doe",
    email="john@test.com",
    phone="+971501234567",
    address="Test Address",
    created_by=User.objects.get(username='admin')
)

# Create equipment
equipment = Equipment.objects.create(
    client=client,
    tag_code="TEST-001",
    type="Crane",
    manufacturer="Test Mfg",
    model="T-100",
    serial_number="SN-12345",
    swl=10.00,
    location="Test Location",
    created_by=User.objects.get(username='admin')
)

print(f"Created client: {client.name}")
print(f"Created equipment: {equipment.tag_code}")
```

## Troubleshooting

**If you can't login to admin:**
```bash
docker compose exec backend python manage.py createsuperuser
```

**If migrations are not applied:**
```bash
docker compose exec backend python manage.py migrate
```

**To reset the database:**
```bash
docker compose down -v
docker compose up --build
```

---

**Happy Testing!** 🚀
