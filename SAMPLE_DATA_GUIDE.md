# Sample Data Generation Guide

This guide explains how to generate sample data for testing the Inspection SaaS application.

## Quick Start

### Step 1: Rebuild Backend Container (to install Faker)

```bash
docker compose up --build backend
```

Wait for the backend to start successfully.

### Step 2: Run the Sample Data Generator

```bash
docker compose exec backend python manage.py generate_sample_data
```

This will create:
- **15 Users** (1 admin, 5 inspectors, 2 managers, 2 team leads, 3 clients)
- **20 Client Companies**
- **50 Equipment Items** (cranes, hoists, forklifts, etc.)
- **15 Tools** (load cells, torque wrenches, etc.)
- **25 Job Orders** (various statuses)
- **40+ Inspections** (various statuses)
- **30 QR Stickers**
- **Calibration Records**
- **Certificates**
- **Approvals**
- **Publications**

### Step 3: Access the Application

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:8000  
**Django Admin:** http://localhost:8000/admin

## Login Credentials

After running the command, you can login with:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Inspector | `inspector1` | `inspector123` |
| Technical Manager | `manager1` | `manager123` |
| Team Lead | `teamlead1` | `teamlead123` |
| Client | `client1` | `client123` |

## Command Options

### Clear Existing Data and Generate Fresh Data

```bash
docker compose exec backend python manage.py generate_sample_data --clear
```

⚠️ **Warning:** This will delete all existing data (except the superuser)!

### Generate Additional Data

You can run the command multiple times to add more data:

```bash
docker compose exec backend python manage.py generate_sample_data
```

## What Data is Generated?

### Users (15 total)
- 1 Admin user (full access)
- 5 Inspector users (can perform inspections)
- 2 Technical Manager users (can approve/reject)
- 2 Team Lead users (can manage teams)
- 3 Client users (read-only access)

### Clients (20 companies)
- Various company names with different industries
- Contact information
- Billing references
- 75% active, 25% inactive

### Equipment (50 items)
- **Types:** Overhead Cranes, Mobile Cranes, Chain Hoists, Wire Rope Hoists, Gantry Cranes, Jib Cranes, Forklifts, Lifting Beams
- **Manufacturers:** Konecranes, Liebherr, Yale, Demag, etc.
- Realistic serial numbers and tag codes
- Safe Working Loads (SWL) ranging from 1 to 100 tons
- Next due dates (past, present, and future)

### Job Orders (25 orders)
- Various statuses: Draft, Scheduled, In Progress, Completed, Published
- PO references
- Site locations in UAE
- Scheduled dates
- Finance status tracking

### Job Line Items (Multiple per job order)
- 1-5 line items per job order
- Different inspection types
- Linked to equipment
- Various statuses

### Inspections (40+ records)
- Linked to job line items
- Assigned to inspectors
- Various statuses: Draft, In Progress, Submitted, Approved, Rejected
- GPS coordinates (UAE region)
- Start and end times
- Checklist templates

### Inspection Answers
- 5-9 answers per completed inspection
- Questions about visual condition, structural integrity, load tests, etc.
- Results: Safe, Not Safe, N/A
- Comments on findings

### Certificates
- Generated for approved inspections
- QR codes
- Approval chain tracking
- Published/Generated status

### QR Stickers (30 stickers)
- Unique sticker codes (TUVINSP-XXXXXX format)
- Some assigned to equipment
- Some available for assignment

### Tools (15 items)
- Load cells, torque wrenches, multimeters, etc.
- Serial numbers
- Calibration due dates
- Assigned to inspectors

### Calibrations
- 1-3 calibration records per tool
- Historical calibration dates
- Next due dates
- Calibration certificates

### Approvals
- Approval records for submitted inspections
- Linked to managers
- Decisions: Pending, Approved, Rejected
- Comments for rejections

### Publications
- Publication records for completed job orders
- Published/Draft status
- Publication dates

## Testing Workflows

After generating sample data, you can test:

### 1. Dashboard
- Login and view statistics
- See recent job orders and inspections

### 2. Job Orders
- View list of 25 job orders
- Filter by status
- Search by PO reference or client
- View job order details
- See line items

### 3. Equipment
- Browse 50 equipment items
- Search by tag code, manufacturer, or serial number
- View equipment details

### 4. Clients
- View 20 client companies
- See contact information
- Filter active/inactive

### 5. Inspections
- View 40+ inspections
- Filter by status
- See inspection details
- View answers and results

### 6. Certificates
- View generated certificates
- Download PDFs (when generated)
- View QR codes

### 7. Stickers
- View 30 QR stickers
- See assigned equipment
- Check availability

### 8. Role-Based Access
- Login as different users
- Test permissions
- Verify role-based menus

## Troubleshooting

### Command Not Found
If you get "Command not found", make sure:
1. The backend container is running
2. The migrations are applied
3. The management command file exists

```bash
docker compose exec backend python manage.py help
```

### Faker Not Installed
If you get "No module named 'faker'":

```bash
docker compose exec backend pip install Faker
```

Or rebuild the container:
```bash
docker compose up --build backend
```

### Database Errors
If you get database errors, try:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py generate_sample_data --clear
```

### Clear All Data
To start fresh:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py generate_sample_data
```

## API Testing with Sample Data

Once data is generated, you can test the API:

### Get Token
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

### List Inspections
```bash
curl http://localhost:8000/api/inspections/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Performance Notes

- The command takes approximately 10-30 seconds to complete
- It creates realistic relationships between models
- Data is randomized but follows business logic
- You can run it multiple times to add more data

## Next Steps

After generating sample data:

1. ✅ Login to the frontend
2. ✅ Browse through different pages
3. ✅ Test search and filtering
4. ✅ Create new records
5. ✅ Test workflows (assign inspector, approve inspection, etc.)
6. ✅ Test different user roles
7. ✅ Verify API responses

---

**Happy Testing!** 🚀
