
# Inspection SaaS — AI Implementation Plan & Prompts (MVP)
Author: Qamar Ibrahim  
Generated: October 2025

---

## Purpose
This file contains a developer-ready, step-by-step implementation plan **and** copy‑paste prompts you can give to an AI assistant (or a developer) to implement the MVP of the Inspection SaaS system (Next.js frontend, Django backend, Docker, Ubuntu). Use this as the single-source plan for the 2‑week MVP delivery.

Keep each prompt focused — run them one at a time and verify outputs/PRs produced by the AI before moving to the next step.

---

## Pre-requisites (local / CI)
- Node.js (LTS, e.g. 18+) and npm / pnpm
- Python 3.10+ (venv)
- Docker & Docker Compose (v2 recommended)
- PostgreSQL (local or Docker)
- Redis (for Celery, optional but recommended)
- (Optional) MinIO or S3 credential if you use remote media storage

---

## Repository layout (recommended)
```
inspection-saas/
├── frontend/                # Next.js app (TypeScript)
├── backend/                 # Django project + apps
├── infra/                   # docker-compose, traefik/nginx, k8s manifests (future)
├── docs/                    # design, API spec, acceptance tests
└── README.md
```

---

## Step-by-step plan + AI prompts

> For every `AI PROMPT` below: paste the whole block into your AI assistant and ask for code + tests + README + run instructions. Request a single PR or archive at the end of each step so you can review. If the AI generates code, run it locally and fix small issues iteratively.

### Step 0 — Initialize repository & branches
AI PROMPT:
```
Create a new git repository skeleton for a full-stack app called `inspection-saas`.
- Create folders: frontend, backend, infra, docs.
- Add a root README.md with short project description, license, and contributing notes.
- Create `.gitignore` for Node, Python, and Docker files.
- Initialize `main` branch and create `dev` branch.
Return the file tree and short instructions how to run the project locally (placeholders for services).
```
Expected result: repository skeleton with branches and README instructions.

---

### Step 1 — Frontend: Next.js TypeScript boilerplate with auth & PWA (Core UI)
Goal: a production-ready Next.js + TypeScript app with authentication, basic pages, Tailwind CSS, and PWA support for offline usage.

AI PROMPT:
```
Create a Next.js (TypeScript) frontend in folder `frontend/` with the following features:
- Use create-next-app (TypeScript), integrate Tailwind CSS, set up a modern minimal design.
- Setup authentication using NextAuth.js (or an equivalent) configured to use JWT / credentials flow against a backend API (env var NEXT_PUBLIC_API_URL). Provide example .env.local.example.
- Pages and routes to implement:
  - / (landing / redirect to dashboard for logged-in users)
  - /login
  - /dashboard (shows last 10 job orders and basic stats)
  - /job-orders (list)
  - /job-orders/create
  - /job-orders/[id] (view job + list line items)
  - /inspections/execute/[inspectionId] (inspection PWA page)
  - /approvals (approver dashboard)
  - /client-portal (client view of published certificates)
- Components: Header, Footer, Sidebar, JobOrderForm, JobOrderCard, JobOrderTable, InspectionForm, ChecklistRow, PhotoCapture (matrix slots), SignaturePad (inspector + client), QRScanner component.
- State/data fetching: implement React Query (or SWR) hooks to consume REST API endpoints at NEXT_PUBLIC_API_URL. Provide a sample `useJobOrders` hook.
- PWA & Offline capabilities: integrate `next-pwa` (or equivalent) and implement a local queue using IndexedDB/localForage for offline-saved inspections; queue sync on reconnect. Add clear steps for how the offline queue works and where it stores items.
- Mobile-friendly responsive layout. Add camera capture using the browser MediaDevices API with fallbacks.
- Include ESLint, Prettier config, and Husky pre-commit hooks.
Return full code, README for frontend, and short local run instructions.
```
Notes: after running this prompt, test login flow and build a dev env variable to point to the backend.

---

### Step 2 — Backend: Django + Django REST Framework skeleton
Goal: create the Django project and app scaffold, auth, basic models and API routing.

AI PROMPT:
```
Create a Django project named `inspection_backend` in folder `backend/` and an app `inspections` with the following base setup:
- Use Poetry or pip + venv (state instructions). Provide requirements.txt or pyproject.toml.
- Install: Django, djangorestframework, djangorestframework-simplejwt, django-cors-headers, django-storages, celery, redis, psycopg2-binary, weasyprint (or reportlab), python-dotenv.
- Extend Django `AbstractUser` (custom user model) to add `role` and `competence` fields. Roles: ADMIN, TEAM_LEAD, TECHNICAL_MANAGER, INSPECTOR, CLIENT.
- Setup JWT auth using SimpleJWT and provide endpoints for token obtain/refresh. Configure CORS for the frontend domain.
- Setup media storage settings with configuration for local development and environment driven S3/MinIO.
- Provide a `docker/Dockerfile` for backend, and a sample `entrypoint.sh` to run migrations and collectstatic.
Return project tree and instructions to run the Django server locally with sample env values.
```
Expected result: Django project with auth and basic settings + JWT ready.

---

### Step 3 — Backend: Models (core schema)
Goal: Add models matching the PDF spec and create migrations.

AI PROMPT:
```
In the Django `inspections` app, create models matching the core database schema below. Use sensible field types, indexes, and relationships. Add `__str__` methods and model Meta (ordering). Include audit fields: created_at, updated_at, created_by (FK), updated_by (FK or nullable):
Models:
- Client { id, name, contact_person, email, phone, address, billing_reference }
- Equipment { id, client (FK), tag_code (unique), type, manufacturer, model, serial_number, swl (decimal), location, next_due (date) }
- JobOrder { id, client (FK), po_reference, created_by (FK to User), status, site_location (text), scheduled_start, scheduled_end, tentative_date, notes }
- JobLineItem { id, job_order (FK), equipment (FK nullable), type, description, quantity, status }
- Inspection { id, job_line_item (FK), inspector (FK User), checklist_template (FK optional), start_time, end_time, status, geo_location (PointField optional) }
- InspectionAnswer { id, inspection (FK), question_key (char), result (char), comment, photo_refs (ManyToMany to PhotoRef) }
- PhotoRef { id, inspection (FK), file (FileField), slot_name, uploaded_at, geotag_lat, geotag_lng }
- Certificate { id, inspection (FK), generated_by, pdf_file (FileField), qr_code (char), issued_date, approval_chain (JSONField) }
- Sticker { id, sticker_code (unique), qr_payload (text), status, assigned_equipment (FK), assigned_at, assigned_by (FK) }
- FieldInspectionReport { id, job_order (FK), fir_pdf (FileField), summary (text), sent_to (email), share_link_token (char) }
- Approval { id, entity_type (char), entity_id (int), approver (FK User), decision (char), comment, decided_at (datetime) }
- Publication { id, job_order (FK), published_by (FK), published_at, status, note }
- Tool, Calibration, AuditLog (minimal fields to record events)
Also: create Django admin registrations for these models and basic list_display configuration.
Run makemigrations and produce initial migration.
```
Notes: ensure unique constraints (e.g., tag_code and sticker_code). Use JSONField for flexible approval_chain data.

---

### Step 4 — Backend: Serializers, Viewsets & Routers (API)
Goal: Implement REST API endpoints used by the frontend (CRUD + custom actions).

AI PROMPT:
```
Using Django REST Framework, create serializers and viewsets for the inspections app with the following endpoints and behavior. Use ModelViewSet where possible and add permissions per role (Admin can full access; Inspector limited to their inspections; Client readonly for published resources):
- POST /api/job_orders/ (create job order)
- GET /api/job_orders/{id}/ (retrieve job order + line items)
- POST /api/job_orders/{id}/assign/ (assign inspector) // custom action
- POST /api/inspections/ (start inspection)
- PATCH /api/inspections/{id}/ (update checklist answers/photos)
- POST /api/inspections/{id}/submit/ (submit inspection for review) // custom action
- POST /api/certificates/{inspection_id}/generate/ (generate certificate PDF and store file)
- POST /api/publish/{job_order_id}/ (publish approved certificates)
- GET /api/stickers/{code}/resolve/ (resolve sticker to equipment + certificate)
Add pagination, filtering by client/inspector/date range, and basic search for equipment by tag_code or serial_number. Add unit tests for at least two critical endpoints.
```
Notes: Ensure API returns minimal nested data to avoid over-fetching.

---

### Step 5 — Backend: PDF generation, QR & Email
Goal: implement certificate PDF generation, persistent QR payload, and email notifications.

AI PROMPT:
```
Add a service `certificate_generator` that can render a certificate PDF from an inspection object. Requirements:
- Use WeasyPrint (preferred) or ReportLab to convert an HTML template to PDF. Template must include company header (letterhead), inspection summary, signatures, photo thumbnails, and QR code.
- Generate a QR payload that links to a public certificate view (or a tokenized share link). Save the QR payload and the printed `sticker_code` format `TUVINSP-000001` in the Sticker model.
- Add an async task (Celery) to generate the PDF and send an email to the client with a link to the FIR and certificate PDF. Email should be configurable (SMTP env vars).
- PDF must be stored in media (S3/MinIO or local storage depending on env).
Return code, tasks, and unit tests for certificate creation.
```
Notes: Provide sample HTML template and WeasyPrint call.

---

### Step 6 — Frontend: Implement core pages & components
Goal: create functional UI pages that consume the backend endpoints

AI PROMPT:
```
Implement the frontend pages and components to consume the REST API. Provide full code for:
- Job Orders list + create flow (form validation + file uploads)
- Job Order detail page showing line items and a `Start Inspection` / `Assign` button
- Inspection Execution PWA page:
  - Preload equipment details when scanning sticker or selecting from dropdown
  - Checklist UI per equipment with ability to mark Safe/Not Safe and input text
  - Photo capture matrix with required slots, preview, and upload progress
  - Signature capture for inspector and client (save as PNG blobs)
  - Save draft locally for offline, show sync queue, and sync on reconnect
- Approver dashboard (list of submitted inspections, with side-by-side photo + checklist review and Approve/Reject actions)
- Client portal to view published certificates (secure view via token or authentication)
- QR Scanner component to resolve sticker codes and open the linked certificate or pre-fill equipment form
Make sure forms upload files as multipart/form-data and show client-friendly error messages.
```
Notes: Provide sample UI screenshots or storybook stories if possible.

---

### Step 7 — Offline-first & Sync design (important)
Goal: reliable offline capture & sync for field inspectors using PWA

AI PROMPT:
```
Design and implement an offline-first flow for the inspection PWA page:
- Use IndexedDB (via localForage) to store draft inspections and photos when offline.
- Photos should be saved as Blobs and stored as references in the IndexedDB record.
- Implement a 'sync queue' worker that retries uploads when connectivity is restored. Show upload progress and status per inspection on the UI (PENDING, UPLOADING, SYNCED, FAILED).
- When syncing, upload photos first, then checklist data, then submit the inspection to backend and mark the FIR ready for approval.
- Provide conflict resolution rules (if the same job was edited online while offline): prefer server version and notify inspector to reconcile.
Deliver code and tests that simulate offline save and sync flow.
```
Notes: Provide explicit instructions for camera file handling and memory usage—compress images before storing.

---

### Step 8 — QR sticker generation & reinspection flow
Goal: bind sticker codes to equipment and support reinspection pre-fill.

AI PROMPT:
```
Implement sticker management endpoints and frontend flows:
- Endpoint to generate and reserve sticker codes in sequence `TUVINSP-000001` (admin only).
- Endpoint `/api/stickers/{code}/resolve/` that returns equipment + latest certificate if available.
- Reinspection flow: scanning a sticker on the PWA should pre-fill equipment details and optionally ask to assign a new sticker code if requested.
- Maintain sticker history: when a sticker is reassigned a previous record becomes `HISTORICAL` and a new assignment is created with `assigned_at` and `assigned_by`.
Return code and tests for sticker endpoints.
```
Notes: Ensure uniqueness and race-condition prevention when issuing stickers (DB-level unique + sequence generator).

---

### Step 9 — Approval & Publishing workflow
Goal: ensure a configurable approval chain and controlled publishing

AI PROMPT:
```
Implement approval and publishing functionality:
- Approvers (technical manager / team lead) can review submitted inspections and either Approve or Reject. Provide reason/comment on rejection.
- On approval, a certificate is generated and stored. Certificates remain PRIVATE until a Publish action is taken.
- Provide endpoint to `POST /api/publish/{job_order_id}/` that can be called only by roles allowed to publish. On publish, certificates become visible in client portal and via QR.
- Record audit logs for every approval, reject, and publish action with timestamp and user info (for ISO 17020 traceability).
Deliver code, permissions, and unit tests that cover the approval/publish workflow.
```
Notes: Approval chain should be configurable per client/job order.

---

### Step 10 — Reporting & Finance tagging
Goal: exports and basic finance fields for handoff to the finance team

AI PROMPT:
```
Add reporting endpoints and a finance integration UI:
- Backend: add endpoints that export CSV / Excel for Job Orders, Inspections, Certificates, Stickers filtered by date range, inspector, client, and status.
- Add finance fields to `JobOrder`: invoice_number (nullable), finance_status (choices: READY, INVOICED), and endpoint for finance staff to tag invoice numbers.
- Frontend Admin: a Reports page where CSV/Excel exports can be generated and scheduled email delivery of reports is possible.
Return code for exports and a simple UI page to trigger reports.
```
Notes: Scheduled jobs can be created using Celery beat.

---

### Step 11 — Tests, CI, and Quality gates
Goal: ensure stable MVP release

AI PROMPT:
```
Add automated tests and CI pipeline:
- Backend: unit tests for models, serializers, and critical API endpoints (inspections submit, certificate generate, sticker resolve).
- Frontend: basic Cypress or Playwright e2e tests for main flows (login, create job order, start inspection, submit inspection when online).
- Create GitHub Actions workflow to run tests on PRs and run linter/formatter checks. Add a build & docker image workflow step for both frontend and backend into `dev` branch PRs.
- Add static analysis: flake8 / isort for Python and ESLint / Prettier for JS.
Return CI yaml files and instructions to connect secrets and run the pipeline.
```
Notes: Keep test coverage focused on critical business flows for MVP.

---

### Step 12 — Docker Compose, infra & local dev script
Goal: reproducible dev environment using Docker Compose

AI PROMPT:
```
Create `infra/docker-compose.yml` with services:
- frontend (build from ./frontend)
- backend (build from ./backend)
- db (postgres:14)
- redis (for Celery)
- minio (optional for S3 compatibility in dev)
- traefik or nginx reverse proxy (optional)
- worker (celery)
Provide Dockerfiles for frontend (Node) and backend (Python), env.example files for both, and a `make dev` or `scripts/dev.sh` to bring the stack up with migrations applied and create a default admin user.
Return docker-compose, Dockerfiles, and README-run instructions.
```
Notes: Use named volumes for postgres data and minio storage.

---

### Step 13 — Deployment recommendations & production checklist
Goal: production-ready deployment notes and runbook

AI PROMPT:
```
Provide a production deployment checklist and basic Terraform/k8s or docker-compose prod notes:
- Secure environment variables and secrets (use Vault/secrets manager)
- Use managed Postgres for production or a hardened instance with backups and retention 10+ years for certificates
- Use S3 (or MinIO) for media and PDFs with lifecycle policies
- Use HTTPS with Let's Encrypt via Traefik or an ingress controller
- Configure logging/monitoring (ELK/EFK, Sentry for errors)
- Setup Celery workers & autoscaling policy for tasks
- Backup & retention policy for certificates (10 years) and audit logs
Provide a short deployment runbook and rollback steps.
```
Deliver: notes and scripts necessary to deploy to a Linux VM or Docker host.

---

## Example copy-paste prompts (ready to use)
Below are smaller, targeted prompts you can paste to the AI to implement specific pieces quickly.

**Create Django Equipment model**:
```
Create a Django model `Equipment` inside `inspections/models.py` with fields:
- client (ForeignKey to Client)
- tag_code (CharField, unique)
- type (CharField)
- manufacturer, model, serial_number (CharFields)
- swl (DecimalField(max_digits=12, decimal_places=2), null=True)
- location (TextField)
- next_due (DateField, null=True)
Add created_at, updated_at timestamps and created_by FK to User (nullable). Register in admin with search_fields for tag_code and serial_number and list_display of id, tag_code, client, next_due.
Also generate the migration file and show how to run `python manage.py migrate`.
```

**Create Next.js Inspection PWA page**:
```
Create a Next.js page at pages/inspections/execute/[inspectionId].tsx that:
- Fetches inspection and equipment data from NEXT_PUBLIC_API_URL using React Query.
- Renders checklist rows with toggle/result, text comment, and optional photo slot upload (up to 6 photos).
- Implements a PhotoCapture component that uses the device camera (MediaDevices.getUserMedia) and file input fallback. Photos are compressed (max 1024px) before upload.
- Implements signature capture using a canvas and exports PNG as base64 to be sent with form.
- Supports saving draft to localForage when offline and a Sync button to upload when online.
- Provide full TypeScript component code and style using Tailwind CSS.
```

**Create Docker Compose**:
```
Generate a docker-compose.yml for dev that includes services: frontend, backend, db (postgres), redis, minio, and worker. The compose file should mount src directories as volumes for live edit and expose ports: frontend:3000, backend:8000, pg:5432, minio:9000. Add environment variables placeholders using .env files. Provide a `scripts/dev.sh` to build and run migrations automatically.
```

---

## Acceptance Criteria (MVP)
- Inspector can create/receive job order and run an inspection offline and sync later.
- Photos (matrix slots), signatures, and checklist are captured and attached to the inspection.
- Approver can review and approve -> certificate PDF is created and stored.
- Inspector/Manager can publish approved certificate -> certificate visible via client portal & QR.
- Sticker scanning resolves equipment and allows reinspection pre-fill.
- Export / reporting endpoint exists for basic finance tagging.

When all above are tested (manual QA and basic automated tests), the MVP can be considered delivered.

---

## Handy checklist for reviewing AI output
When the AI returns code, verify:
- Basic linting passes (ESLint, flake8)
- Backend migrations created and run without errors
- API security: token auth works and roles enforced
- File uploads stored in configured storage (local dev or S3)
- Offline save + sync works in Chrome mobile and desktop with simulated offline
- PDF certificate contains QR and signature images
- Sticker generation is atomic and race condition free

---

## Final notes & workflow advice
- Use the plan sequentially. Don’t ask the AI to produce the entire system in one prompt — break work into PR-sized chunks and review each PR.
- Keep environment secrets out of prompts; instead use placeholders in `.env.example` and inject real secrets in CI / deployment.
- After MVP delivery, present Phase 2 features and pricing as part of post-MVP add-ons.

---

If you want, I can now:
- 1) generate a ZIP archive with an empty repo skeleton that follows the layout above, or
- 2) generate starter boilerplate code (first PR) for the backend models and the frontend auth pages.

Reply with `1` or `2` (or both) and I'll generate them.
