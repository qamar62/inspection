from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Custom User model with role and competence fields"""
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        TEAM_LEAD = 'TEAM_LEAD', 'Team Lead'
        TECHNICAL_MANAGER = 'TECHNICAL_MANAGER', 'Technical Manager'
        INSPECTOR = 'INSPECTOR', 'Inspector'
        CLIENT = 'CLIENT', 'Client'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INSPECTOR
    )
    competence = models.TextField(blank=True, help_text="Inspector competencies and certifications")
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class TimeStampedModel(models.Model):
    """Abstract base model with timestamp fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class AuditedModel(TimeStampedModel):
    """Abstract base model with audit fields"""
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated'
    )
    
    class Meta:
        abstract = True


class Client(AuditedModel):
    """Client/Customer model"""
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    billing_reference = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'clients'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return self.name


class Equipment(AuditedModel):
    """Equipment model for items to be inspected"""
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='equipment')
    tag_code = models.CharField(max_length=100, unique=True, db_index=True)
    type = models.CharField(max_length=100, help_text="Equipment type (e.g., Crane, Hoist)")
    manufacturer = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    swl = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Safe Working Load"
    )
    location = models.TextField()
    next_due = models.DateField(null=True, blank=True, help_text="Next inspection due date")
    
    class Meta:
        db_table = 'equipment'
        ordering = ['tag_code']
        indexes = [
            models.Index(fields=['tag_code']),
            models.Index(fields=['serial_number']),
            models.Index(fields=['client', 'next_due']),
        ]
        verbose_name_plural = 'Equipment'
    
    def __str__(self):
        return f"{self.tag_code} - {self.type}"


class Service(AuditedModel):
    """Service master registry entry"""

    class Category(models.TextChoices):
        INSPECTION = 'INSPECTION', 'Inspection'
        TESTING = 'TESTING', 'Testing'
        TRAINING = 'TRAINING', 'Training'
        OPERATOR_CERTIFICATION = 'OPERATOR_CERTIFICATION', 'Operator Certification'
        CALIBRATION = 'CALIBRATION', 'Calibration'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name_en = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices)
    discipline = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    description = models.TextField(blank=True)
    current_version = models.ForeignKey(
        'ServiceVersion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )

    class Meta:
        db_table = 'services'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name_en}"


class ServiceVersion(AuditedModel):
    """Versioned governance details for a service"""

    class RequirementLevel(models.TextChoices):
        MANDATORY = 'MANDATORY', 'Mandatory'
        OPTIONAL = 'OPTIONAL', 'Optional'
        NOT_REQUIRED = 'NOT_REQUIRED', 'Not Required'

    class StickerPolicy(models.TextChoices):
        REQUIRED = 'REQUIRED', 'Required'
        OPTIONAL = 'OPTIONAL', 'Optional'
        NOT_APPLICABLE = 'NOT_APPLICABLE', 'Not Applicable'

    class ChecklistLevel(models.TextChoices):
        SIMPLIFIED = 'SIMPLIFIED', 'Simplified'
        EXPANDED = 'EXPANDED', 'Expanded'
        CRITICAL = 'CRITICAL', 'Critical'

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    effective_date = models.DateField(default=timezone.now)
    is_published = models.BooleanField(default=False)
    requires_equipment = models.CharField(
        max_length=20,
        choices=RequirementLevel.choices,
        default=RequirementLevel.NOT_REQUIRED
    )
    requires_person = models.CharField(
        max_length=20,
        choices=RequirementLevel.choices,
        default=RequirementLevel.NOT_REQUIRED
    )
    checklist_template = models.CharField(max_length=150, blank=True)
    default_checklist_level = models.CharField(
        max_length=20,
        choices=ChecklistLevel.choices,
        default=ChecklistLevel.SIMPLIFIED
    )
    minimum_checklist_level = models.CharField(
        max_length=20,
        choices=ChecklistLevel.choices,
        default=ChecklistLevel.SIMPLIFIED
    )
    allow_bulk_all_ok = models.BooleanField(default=False)
    require_photo_evidence = models.BooleanField(default=False)
    require_document_evidence = models.BooleanField(default=False)
    sticker_policy = models.CharField(
        max_length=20,
        choices=StickerPolicy.choices,
        default=StickerPolicy.NOT_APPLICABLE
    )
    approval_required = models.BooleanField(default=False)
    approver_roles = models.JSONField(default=list, blank=True, help_text="List of approver role names")
    validity_max_months = models.PositiveIntegerField(null=True, blank=True)
    validity_options = models.JSONField(default=list, blank=True, help_text="Allowed validity options in months")
    output_definitions = models.JSONField(default=list, blank=True, help_text="Controlled outputs for the service")
    standards = models.JSONField(default=list, blank=True, help_text="Linked standards or procedures")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'service_versions'
        ordering = ['service', '-version_number']
        unique_together = ['service', 'version_number']
        indexes = [
            models.Index(fields=['service', 'version_number']),
            models.Index(fields=['service', 'is_published']),
        ]

    def __str__(self):
        return f"{self.service.code} v{self.version_number}"

    def save(self, *args, **kwargs):
        if not self.version_number:
            last_version = ServiceVersion.objects.filter(service=self.service).order_by('-version_number').first()
            next_version = (last_version.version_number if last_version else 0) + 1
            self.version_number = next_version

        super().save(*args, **kwargs)

        if self.is_published:
            service = self.service
            if service.current_version_id != self.id:
                service.current_version = self
                service.save(update_fields=['current_version'])


class JobOrder(AuditedModel):
    """Job Order model"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        PUBLISHED = 'PUBLISHED', 'Published'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class FinanceStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        READY = 'READY', 'Ready for Invoice'
        INVOICED = 'INVOICED', 'Invoiced'
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='job_orders')
    po_reference = models.CharField(max_length=100, blank=True, help_text="Purchase Order reference")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    site_location = models.TextField()
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    tentative_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Finance fields
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    finance_status = models.CharField(
        max_length=20,
        choices=FinanceStatus.choices,
        default=FinanceStatus.PENDING
    )
    
    class Meta:
        db_table = 'job_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status', 'scheduled_start']),
        ]
    
    def __str__(self):
        return f"JO-{self.id} - {self.client.name}"


class JobLineItem(AuditedModel):
    """Line items within a Job Order"""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
    
    job_order = models.ForeignKey(JobOrder, on_delete=models.CASCADE, related_name='line_items')
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='line_items'
    )
    type = models.CharField(max_length=100, help_text="Inspection type")
    description = models.TextField()
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    class Meta:
        db_table = 'job_line_items'
        ordering = ['job_order', 'id']
    
    def __str__(self):
        return f"{self.job_order} - {self.type}"


class Inspection(AuditedModel):
    """Inspection execution model"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        SUBMITTED = 'SUBMITTED', 'Submitted for Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
    
    job_line_item = models.ForeignKey(
        JobLineItem,
        on_delete=models.CASCADE,
        related_name='inspections'
    )
    inspector = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='inspections'
    )
    checklist_template = models.CharField(max_length=100, blank=True, help_text="Checklist template name")
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    geo_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    inspector_signature = models.FileField(upload_to='signatures/', null=True, blank=True)
    client_signature = models.FileField(upload_to='signatures/', null=True, blank=True)
    
    class Meta:
        db_table = 'inspections'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['inspector', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Inspection {self.id} - {self.job_line_item}"


class InspectionAnswer(TimeStampedModel):
    """Checklist answers for an inspection"""
    
    class Result(models.TextChoices):
        SAFE = 'SAFE', 'Safe'
        NOT_SAFE = 'NOT_SAFE', 'Not Safe'
        NA = 'NA', 'Not Applicable'
    
    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question_key = models.CharField(max_length=100, help_text="Question identifier")
    result = models.CharField(max_length=20, choices=Result.choices)
    comment = models.TextField(blank=True)
    
    class Meta:
        db_table = 'inspection_answers'
        unique_together = ['inspection', 'question_key']
        ordering = ['inspection', 'question_key']
    
    def __str__(self):
        return f"{self.inspection} - {self.question_key}: {self.result}"


class PhotoRef(TimeStampedModel):
    """Photo references for inspections"""
    inspection = models.ForeignKey(
        Inspection,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    answer = models.ForeignKey(
        InspectionAnswer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='photos'
    )
    file = models.ImageField(upload_to='inspection_photos/')
    slot_name = models.CharField(max_length=50, help_text="Photo slot identifier (e.g., FRONT, SIDE1)")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    geotag_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geotag_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    class Meta:
        db_table = 'photo_refs'
        ordering = ['inspection', 'slot_name']
        indexes = [
            models.Index(fields=['inspection', 'slot_name']),
        ]
    
    def __str__(self):
        return f"{self.inspection} - {self.slot_name}"


class Certificate(AuditedModel):
    """Certificate model for approved inspections"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        GENERATED = 'GENERATED', 'Generated'
        PUBLISHED = 'PUBLISHED', 'Published'
    
    inspection = models.OneToOneField(
        Inspection,
        on_delete=models.CASCADE,
        related_name='certificate'
    )
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='certificates_generated'
    )
    pdf_file = models.FileField(upload_to='certificates/')
    qr_code = models.CharField(max_length=255, unique=True, db_index=True)
    issued_date = models.DateTimeField(default=timezone.now)
    approval_chain = models.JSONField(default=dict, help_text="Approval history")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    share_link_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    class Meta:
        db_table = 'certificates'
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['qr_code']),
            models.Index(fields=['share_link_token']),
        ]
    
    def __str__(self):
        return f"Certificate {self.id} - {self.inspection}"


class Sticker(AuditedModel):
    """QR Sticker management"""
    
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        HISTORICAL = 'HISTORICAL', 'Historical'
    
    sticker_code = models.CharField(max_length=50, unique=True, db_index=True)
    qr_payload = models.TextField(help_text="QR code data/URL")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    assigned_equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stickers'
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stickers_assigned'
    )
    
    class Meta:
        db_table = 'stickers'
        ordering = ['sticker_code']
        indexes = [
            models.Index(fields=['sticker_code']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return self.sticker_code


class FieldInspectionReport(AuditedModel):
    """Field Inspection Report (FIR) for job orders"""
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name='field_reports'
    )
    fir_pdf = models.FileField(upload_to='fir_reports/')
    summary = models.TextField()
    sent_to = models.EmailField(blank=True)
    share_link_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    class Meta:
        db_table = 'field_inspection_reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"FIR {self.id} - {self.job_order}"


class Approval(TimeStampedModel):
    """Approval workflow model"""
    
    class EntityType(models.TextChoices):
        INSPECTION = 'INSPECTION', 'Inspection'
        CERTIFICATE = 'CERTIFICATE', 'Certificate'
        JOB_ORDER = 'JOB_ORDER', 'Job Order'
    
    class Decision(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
    
    entity_type = models.CharField(max_length=20, choices=EntityType.choices)
    entity_id = models.PositiveIntegerField()
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approvals')
    decision = models.CharField(max_length=20, choices=Decision.choices, default=Decision.PENDING)
    comment = models.TextField(blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'approvals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['approver', 'decision']),
        ]
    
    def __str__(self):
        return f"{self.entity_type} {self.entity_id} - {self.decision}"


class Publication(AuditedModel):
    """Publication tracking for job orders"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        REVOKED = 'REVOKED', 'Revoked'
    
    job_order = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name='publications'
    )
    published_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='publications'
    )
    published_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    note = models.TextField(blank=True)
    
    class Meta:
        db_table = 'publications'
        ordering = ['-published_at']
    
    def __str__(self):
        return f"Publication {self.id} - {self.job_order}"


class ToolCategory(AuditedModel):
    """Categorisation for tools and instruments."""

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    requires_calibration = models.BooleanField(default=False)
    calibration_interval_days = models.PositiveIntegerField(null=True, blank=True)
    default_assignment_type = models.CharField(
        max_length=20,
        choices=[
            ('INDIVIDUAL', 'Individual'),
            ('TEAM', 'Team'),
            ('JOB_ORDER', 'Job Order'),
            ('POOL', 'Shared Pool'),
        ],
        default='INDIVIDUAL'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'tool_categories'
        ordering = ['name']
        verbose_name_plural = 'Tool Categories'

    def __str__(self):
        return f"{self.code} - {self.name}"


class Tool(AuditedModel):
    """Tools and instruments used by inspectors"""

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        CALIBRATION = 'CALIBRATION', 'Under Calibration'
        LOST = 'LOST', 'Lost'
        RETIRED = 'RETIRED', 'Retired'

    class AssignmentMode(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', 'Individual'
        TEAM = 'TEAM', 'Team'
        JOB_ORDER = 'JOB_ORDER', 'Job Order'
        POOL = 'POOL', 'Shared Pool'

    name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255, unique=True)
    category = models.ForeignKey(
        ToolCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tools'
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.AVAILABLE)
    assignment_mode = models.CharField(max_length=20, choices=AssignmentMode.choices, default=AssignmentMode.INDIVIDUAL)
    location = models.CharField(max_length=255, blank=True)
    calibration_due = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tools'
    )

    class Meta:
        db_table = 'tools'
        ordering = ['name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return f"{self.name} - {self.serial_number}"

    @property
    def is_overdue_for_calibration(self):
        if not self.calibration_due:
            return False
        return self.calibration_due < timezone.now().date()


class ToolAssignment(AuditedModel):
    """Assignment lifecycle for tools."""

    class AssignmentType(models.TextChoices):
        USER = 'USER', 'User'
        JOB_ORDER = 'JOB_ORDER', 'Job Order'
        EQUIPMENT = 'EQUIPMENT', 'Equipment'
        CLIENT = 'CLIENT', 'Client Contact'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        RETURNED = 'RETURNED', 'Returned'
        LOST = 'LOST', 'Lost'
        DAMAGED = 'DAMAGED', 'Damaged'

    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='assignments')
    assignment_type = models.CharField(max_length=15, choices=AssignmentType.choices)
    assigned_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_assignments')
    job_order = models.ForeignKey('JobOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_assignments')
    equipment = models.ForeignKey('Equipment', on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_assignments')
    client = models.ForeignKey('Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_assignments')
    assigned_on = models.DateTimeField(default=timezone.now)
    expected_return = models.DateField(null=True, blank=True)
    returned_on = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'tool_assignments'
        ordering = ['-assigned_on']
        indexes = [
            models.Index(fields=['tool', 'status']),
            models.Index(fields=['assignment_type', 'status']),
        ]

    def __str__(self):
        return f"{self.tool} -> {self.assignment_type} ({self.get_status_display()})"


class ToolUsageLog(TimeStampedModel):
    """Automatic usage logs for tools."""

    class EventType(models.TextChoices):
        CHECKOUT = 'CHECKOUT', 'Check-out'
        CHECKIN = 'CHECKIN', 'Check-in'
        CALIBRATION = 'CALIBRATION', 'Calibration'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        REPAIR = 'REPAIR', 'Repair'
        ALERT = 'ALERT', 'Alert'

    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='usage_logs')
    assignment = models.ForeignKey(ToolAssignment, on_delete=models.SET_NULL, null=True, blank=True, related_name='usage_logs')
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    occurred_at = models.DateTimeField(default=timezone.now)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_usage_actions')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'tool_usage_logs'
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['tool', 'event_type']),
        ]

    def __str__(self):
        return f"{self.tool} - {self.event_type}"


class ToolIncident(AuditedModel):
    """Loss or damage incidents recorded for tools."""

    class IncidentType(models.TextChoices):
        LOSS = 'LOSS', 'Loss'
        DAMAGE = 'DAMAGE', 'Damage'
        CALIBRATION_FAILURE = 'CALIBRATION_FAILURE', 'Calibration Failure'
        OTHER = 'OTHER', 'Other'

    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'

    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='incidents')
    incident_type = models.CharField(max_length=25, choices=IncidentType.choices)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MEDIUM)
    occurred_on = models.DateField(default=timezone.now)
    description = models.TextField()
    resolved_on = models.DateField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        db_table = 'tool_incidents'
        ordering = ['-occurred_on']

    def __str__(self):
        return f"{self.tool} - {self.incident_type}"


class Calibration(AuditedModel):
    """Calibration records for tools"""
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='calibrations')
    calibration_date = models.DateField()
    next_due = models.DateField()
    certificate_file = models.FileField(upload_to='calibration_certificates/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'calibrations'
        ordering = ['-calibration_date']
    
    def __str__(self):
        return f"{self.tool} - {self.calibration_date}"


class AuditLog(models.Model):
    """Audit log for ISO 17020 compliance"""
    
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'
        PUBLISH = 'PUBLISH', 'Publish'
        REVOKE = 'REVOKE', 'Revoke'
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField()
    changes = models.JSONField(default=dict, help_text="Changed fields and values")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.entity_type} {self.entity_id}"


class CompetenceAuthorization(AuditedModel):
    """Structured competence authorizations per service/discipline."""

    class AuthorizationLevel(models.TextChoices):
        SUPERVISED = 'SUPERVISED', 'Supervised'
        AUTHORIZED = 'AUTHORIZED', 'Authorized'
        LEAD = 'LEAD', 'Lead'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competence_authorizations')
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='competence_authorizations'
    )
    discipline = models.CharField(max_length=120, blank=True, help_text="Discipline or subcategory for this authorization")
    level = models.CharField(max_length=15, choices=AuthorizationLevel.choices, default=AuthorizationLevel.SUPERVISED)
    scope_notes = models.TextField(blank=True, help_text="Additional scope notes or limitations")
    valid_from = models.DateField(default=timezone.now)
    valid_until = models.DateField(null=True, blank=True)
    last_assessed = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        db_table = 'competence_authorizations'
        ordering = ['user', '-valid_from']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['service', 'discipline']),
        ]
        unique_together = [('user', 'service', 'discipline', 'level', 'valid_from')]

    def __str__(self):
        service_code = self.service.code if self.service else 'General'
        return f"{self.user.get_full_name()} - {service_code} ({self.get_level_display()})"


class CompetenceEvidence(TimeStampedModel):
    """Evidence artifacts supporting an authorization."""

    class EvidenceType(models.TextChoices):
        TRAINING = 'TRAINING', 'Training'
        CERTIFICATE = 'CERTIFICATE', 'Certificate'
        ASSESSMENT = 'ASSESSMENT', 'Assessment'
        OTHER = 'OTHER', 'Other'

    authorization = models.ForeignKey(
        CompetenceAuthorization,
        on_delete=models.CASCADE,
        related_name='evidence_items'
    )
    evidence_type = models.CharField(max_length=15, choices=EvidenceType.choices, default=EvidenceType.TRAINING)
    issued_by = models.CharField(max_length=255, blank=True)
    issued_on = models.DateField(null=True, blank=True)
    reference_code = models.CharField(max_length=100, blank=True)
    document = models.FileField(upload_to='competence_evidence/', blank=True, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'competence_evidence'
        ordering = ['-issued_on', '-created_at']

    def __str__(self):
        return f"Evidence {self.id} for authorization {self.authorization_id}"


class Person(AuditedModel):
    """People registry for operators, trainees, and client staff."""

    class PersonType(models.TextChoices):
        OPERATOR = 'OPERATOR', 'Operator'
        TRAINEE = 'TRAINEE', 'Trainee'
        CLIENT_STAFF = 'CLIENT_STAFF', 'Client Staff'
        INTERNAL = 'INTERNAL', 'Internal Staff'

    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    person_type = models.CharField(max_length=20, choices=PersonType.choices, default=PersonType.OPERATOR)
    employer = models.CharField(max_length=255, blank=True)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='associated_people')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'people'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['person_type']),
            models.Index(fields=['client', 'person_type']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class PersonCredential(TimeStampedModel):
    """Certificates/credentials held by registered people."""

    class CredentialStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        REVOKED = 'REVOKED', 'Revoked'

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='credentials')
    credential_name = models.CharField(max_length=150)
    issuing_body = models.CharField(max_length=255, blank=True)
    reference_code = models.CharField(max_length=120, blank=True)
    issued_on = models.DateField(default=timezone.now)
    valid_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=CredentialStatus.choices, default=CredentialStatus.ACTIVE)
    document = models.FileField(upload_to='people_credentials/', blank=True, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'person_credentials'
        ordering = ['person', '-issued_on']
        indexes = [
            models.Index(fields=['person', 'status']),
            models.Index(fields=['valid_until']),
        ]

    def __str__(self):
        return f"{self.credential_name} - {self.person}"
