# Backend Requirements Status

_Last updated: 2026-01-22_

## Implemented / Partially Implemented

- **Core user accounts** with role field and competence notes for inspectors.
- **Client and equipment registries** covering core client data and equipment metadata with next due dates.
- **Job order management** including line items, assignments, inspection execution, approvals, FIRs, and publication tracking.
- **Certificate lifecycle** from inspection approval to PDF generation, QR share tokens, and publication.
- **Sticker generation and resolution** for equipment linkage and history lookup.
- **Tools & instruments governance** covering categories, assignment lifecycle, calibration enforcement, usage logging, and incident tracking.
- **Audit log model** capable of storing ISO/IEC 17020 trail data (create/update/approve/publish actions).
- **Service Master Registry backend** with Service & ServiceVersion models, serializers, viewsets, filtering, and admin-permissioned CRUD APIs.
- **HR competence matrix backend** covering authorizations, evidence tracking, and admin tooling.
- **People registry backend** for internal/external personnel with credential tracking and admin UX grouping.

## Pending Implementation / Enhancements Needed

- **Quotation module** with service line linkage, pricing, VAT handling, acceptance evidence, PDF output, and status lifecycle.
- **Job Order creation from quotations** including scope selection, preloaded execution instances, and “added at site” flows with approvals.
- **Controlled templates and digital forms** for checklists, training proformas, assessments, and offline-friendly execution.
- **Offline field app support** (sync queues, conflict handling, pending sync states, evidence requirements enforcement).
- **Training & operator certification modules** (course catalog, sessions, QR-based attendance/assessment, certificates/wallet cards).
- **Company assets registry** for non-inspection assets with movement history and responsibility tracking.
- **Controlled stock management** for letterheads and wallet cards, including issuance, numbering validation, and archival rendering flows.
- **Document numbering rules** (non-sequential IDs, final archival copy generation, letterhead number capture).
- **Client portal enablement** with scoped roles, document visibility, and notification rules tied to registered contacts.
- **Notification system** (JO created/published, FIR issued) with configurable recipients, templates, and delivery logs.
- **Finance handoff** with executed quantity snapshots, PO references, invoice number tracking, duplicate/SLA checks, and billing exports _(deferred to end phase per latest plan)._ 
- **Training & operator certification integration** with the people registry (course catalog, attendance, certificate issuance, wallet cards).
