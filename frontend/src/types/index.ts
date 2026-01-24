// User types
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'ADMIN' | 'TEAM_LEAD' | 'TECHNICAL_MANAGER' | 'INSPECTOR' | 'CLIENT'
  competence?: string
  phone?: string
}

export interface JobOrderListItem {
  id: number
  client: number
  client_name: string
  po_reference: string
  status: JobOrder['status']
  site_location: string
  scheduled_start?: string
  finance_status: JobOrder['finance_status']
  line_items_count: number
  created_at: string
}

// Client types
export interface Client {
  id: number
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  billing_reference?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Equipment types
export interface Equipment {
  id: number
  client: number
  client_name: string
  tag_code: string
  type: string
  manufacturer: string
  model: string
  serial_number: string
  swl?: number
  location: string
  next_due?: string
  created_at: string
  updated_at: string
}

// Job Order types
export interface JobOrder {
  id: number
  client: number
  client_name: string
  po_reference: string
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED' | 'CANCELLED'
  site_location: string
  scheduled_start?: string
  scheduled_end?: string
  tentative_date?: string
  notes?: string
  invoice_number?: string
  finance_status: 'PENDING' | 'READY' | 'INVOICED'
  line_items?: JobLineItem[]
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface JobLineItem {
  id: number
  job_order: number
  equipment?: number
  equipment_info?: Equipment
  type: string
  description: string
  quantity: number
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  inspections?: Inspection[]
  created_at: string
  updated_at: string
}

// Inspection types
export interface Inspection {
  id: number
  job_line_item: number
  inspector: number
  inspector_name: string
  checklist_template?: string
  start_time?: string
  end_time?: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  geo_location_lat?: number
  geo_location_lng?: number
  inspector_signature?: string
  client_signature?: string
  answers?: InspectionAnswer[]
  photos?: PhotoRef[]
  equipment_info?: Equipment
  created_at: string
  updated_at: string
}

export interface InspectionAnswer {
  id: number
  inspection: number
  question_key: string
  result: 'SAFE' | 'NOT_SAFE' | 'NA'
  comment?: string
  photos?: PhotoRef[]
  created_at: string
  updated_at: string
}

export interface PhotoRef {
  id: number
  inspection: number
  answer?: number
  file: string
  slot_name: string
  uploaded_at: string
  geotag_lat?: number
  geotag_lng?: number
}

export interface FieldInspectionReport {
  id: number
  job_order: number
  job_order_info?: JobOrderListItem
  fir_pdf?: string
  summary: string
  sent_to?: string
  share_link_token: string
  created_at: string
  updated_at: string
}

// Certificate types
export interface Certificate {
  id: number
  inspection: number
  inspection_info?: Inspection
  generated_by: number
  generated_by_name: string
  pdf_file: string
  qr_code: string
  issued_date: string
  approval_chain: any
  status: 'DRAFT' | 'GENERATED' | 'PUBLISHED'
  share_link_token: string
  public_url?: string
  created_at: string
  updated_at: string
}

// Sticker types
export interface Sticker {
  id: number
  sticker_code: string
  qr_payload: string
  status: 'AVAILABLE' | 'ASSIGNED' | 'HISTORICAL'
  assigned_equipment?: number
  equipment_info?: Equipment
  assigned_at?: string
  assigned_by?: number
  assigned_by_name?: string
  created_at: string
  updated_at: string
}

// Approval types
export interface Approval {
  id: number
  entity_type: 'INSPECTION' | 'CERTIFICATE' | 'JOB_ORDER'
  entity_id: number
  approver: number
  approver_name: string
  decision: 'PENDING' | 'APPROVED' | 'REJECTED'
  comment?: string
  decided_at?: string
  created_at: string
  updated_at: string
}

// Offline sync types
export interface OfflineInspection {
  id: string
  inspection_id?: number
  job_line_item: number
  inspector: number
  status: 'PENDING' | 'UPLOADING' | 'SYNCED' | 'FAILED'
  data: {
    answers: Partial<InspectionAnswer>[]
    photos: {
      slot_name: string
      blob: Blob
      geotag_lat?: number
      geotag_lng?: number
    }[]
    inspector_signature?: Blob
    client_signature?: Blob
  }
  created_at: string
  synced_at?: string
  error?: string
}

// API Response types
export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface ApiError {
  detail?: string
  [key: string]: any
}

// HR People Registry types
export type PersonType = 'OPERATOR' | 'TRAINEE' | 'CLIENT_STAFF' | 'INTERNAL'

export interface PersonCredential {
  id: number
  person: number
  credential_name: string
  issuing_body?: string
  reference_code?: string
  issued_on?: string
  valid_until?: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
  document?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Person {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  person_type: PersonType
  employer?: string
  client?: number
  client_name?: string
  notes?: string
  credentials?: PersonCredential[]
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

// Competence Matrix types
export type CompetenceLevel = 'SUPERVISED' | 'AUTHORIZED' | 'LEAD'

export type CompetenceStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'

export type CompetenceEvidenceType = 'TRAINING' | 'CERTIFICATE' | 'ASSESSMENT' | 'OTHER'

export interface CompetenceEvidence {
  id: number
  authorization: number
  evidence_type: CompetenceEvidenceType
  issued_by?: string
  issued_on?: string
  reference_code?: string
  document?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CompetenceAuthorization {
  id: number
  user: number
  user_name?: string
  service: number
  service_code?: string
  discipline?: string
  level: CompetenceLevel
  scope_notes?: string
  valid_from?: string
  valid_until?: string
  last_assessed?: string
  status: CompetenceStatus
  evidence_items?: CompetenceEvidence[]
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

// Tool governance types
export type ToolAssignmentType = 'USER' | 'JOB_ORDER' | 'EQUIPMENT' | 'CLIENT'

export type ToolStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'CALIBRATION' | 'LOST' | 'RETIRED'

export interface ToolCategory {
  id: number
  code: string
  name: string
  description?: string
  requires_calibration: boolean
  calibration_interval_days?: number
  default_assignment_type: ToolAssignmentType
  notes?: string
  created_at: string
  updated_at: string
}

export interface Tool {
  id: number
  name: string
  serial_number: string
  category?: number
  category_info?: ToolCategory
  status: ToolStatus
  assignment_mode: 'INDIVIDUAL' | 'TEAM' | 'JOB_ORDER' | 'POOL'
  location?: string
  calibration_due?: string
  assigned_to?: number
  assigned_to_name?: string
  is_overdue_for_calibration?: boolean
  created_at: string
  updated_at: string
}

export type ToolAssignmentStatus = 'ACTIVE' | 'RETURNED' | 'LOST' | 'DAMAGED'

export interface ToolAssignment {
  id: number
  tool: number
  tool_info?: Tool
  assignment_type: ToolAssignmentType
  status: ToolAssignmentStatus
  assigned_user?: number
  assigned_user_name?: string
  job_order?: number
  job_order_reference?: string
  equipment?: number
  equipment_tag?: string
  client?: number
  client_name?: string
  assigned_on: string
  expected_return?: string
  returned_on?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

export type ToolUsageEvent = 'CHECKOUT' | 'CHECKIN' | 'CALIBRATION' | 'MAINTENANCE' | 'REPAIR' | 'ALERT'

export interface ToolUsageLog {
  id: number
  tool: number
  tool_info?: Tool
  assignment?: number
  assignment_info?: ToolAssignment
  event_type: ToolUsageEvent
  occurred_at: string
  performed_by?: number
  performed_by_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ToolIncidentType = 'LOSS' | 'DAMAGE' | 'CALIBRATION_FAILURE' | 'OTHER'

export type ToolIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface ToolIncident {
  id: number
  tool: number
  tool_info?: Tool
  incident_type: ToolIncidentType
  severity: ToolIncidentSeverity
  occurred_on: string
  description?: string
  resolved_on?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

// Service Master Registry types
export type ServiceCategory =
  | 'INSPECTION'
  | 'TESTING'
  | 'TRAINING'
  | 'OPERATOR_CERTIFICATION'
  | 'CALIBRATION'

export type RequirementLevel = 'MANDATORY' | 'OPTIONAL' | 'NOT_REQUIRED'
export type StickerPolicy = 'REQUIRED' | 'OPTIONAL' | 'NOT_APPLICABLE'
export type ChecklistLevel = 'SIMPLIFIED' | 'EXPANDED' | 'CRITICAL'

export interface ServiceVersion {
  id: number
  service: number
  version_number: number
  effective_date: string
  is_published: boolean
  requires_equipment: RequirementLevel
  requires_person: RequirementLevel
  checklist_template?: string
  default_checklist_level: ChecklistLevel
  minimum_checklist_level: ChecklistLevel
  allow_bulk_all_ok: boolean
  require_photo_evidence: boolean
  require_document_evidence: boolean
  sticker_policy: StickerPolicy
  approval_required: boolean
  approver_roles: string[]
  validity_max_months?: number
  validity_options: number[]
  output_definitions: any[]
  standards: string[]
  notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

export interface Service {
  id: number
  code: string
  name_en: string
  name_ar?: string
  category: ServiceCategory
  discipline?: string
  status: 'ACTIVE' | 'INACTIVE'
  description?: string
  current_version?: ServiceVersion
  versions?: ServiceVersion[]
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}
