from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import (
    Client, Equipment, JobOrder, JobLineItem, Inspection,
    InspectionAnswer, PhotoRef, Certificate, Sticker,
    FieldInspectionReport, Approval, Publication, Tool, Calibration,
    Service, ServiceVersion, CompetenceAuthorization,
    CompetenceEvidence, Person, PersonCredential, ToolCategory,
    ToolAssignment, ToolUsageLog, ToolIncident
)


class ServiceVersionSerializer(serializers.ModelSerializer):
    """Service version serializer"""
    class Meta:
        model = ServiceVersion
        fields = [
            'id', 'service', 'version_number', 'effective_date', 'is_published',
            'requires_equipment', 'requires_person', 'checklist_template',
            'default_checklist_level', 'minimum_checklist_level', 'allow_bulk_all_ok',
            'require_photo_evidence', 'require_document_evidence', 'sticker_policy',
            'approval_required', 'approver_roles', 'validity_max_months',
            'validity_options', 'output_definitions', 'standards', 'notes',
            'created_by', 'updated_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'version_number', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ServiceSerializer(serializers.ModelSerializer):
    """Service serializer"""
    versions = ServiceVersionSerializer(many=True, read_only=True)
    current_version = ServiceVersionSerializer(read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'code', 'name_en', 'name_ar', 'category', 'discipline', 'status',
            'description', 'current_version', 'versions', 'created_by', 'updated_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_version', 'created_at', 'updated_at', 'created_by', 'updated_by']

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'competence', 'phone']
        read_only_fields = ['id']


class ClientSerializer(serializers.ModelSerializer):
    """Client serializer"""
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone',
            'address', 'billing_reference', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EquipmentSerializer(serializers.ModelSerializer):
    """Equipment serializer"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'client', 'client_name', 'tag_code', 'type',
            'manufacturer', 'model', 'serial_number', 'swl',
            'location', 'next_due', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PhotoRefSerializer(serializers.ModelSerializer):
    """Photo reference serializer"""
    class Meta:
        model = PhotoRef
        fields = [
            'id', 'inspection', 'answer', 'file', 'slot_name',
            'uploaded_at', 'geotag_lat', 'geotag_lng'
        ]
        read_only_fields = ['id', 'uploaded_at']


class InspectionAnswerSerializer(serializers.ModelSerializer):
    """Inspection answer serializer"""
    photos = PhotoRefSerializer(many=True, read_only=True)
    
    class Meta:
        model = InspectionAnswer
        fields = [
            'id', 'inspection', 'question_key', 'result',
            'comment', 'photos', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InspectionSerializer(serializers.ModelSerializer):
    """Inspection serializer"""
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True)
    answers = InspectionAnswerSerializer(many=True, read_only=True)
    photos = PhotoRefSerializer(many=True, read_only=True)
    equipment_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Inspection
        fields = [
            'id', 'job_line_item', 'inspector', 'inspector_name',
            'checklist_template', 'start_time', 'end_time', 'status',
            'geo_location_lat', 'geo_location_lng',
            'inspector_signature', 'client_signature',
            'answers', 'photos', 'equipment_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_equipment_info(self, obj):
        if obj.job_line_item and obj.job_line_item.equipment:
            return EquipmentSerializer(obj.job_line_item.equipment).data
        return None


class JobLineItemSerializer(serializers.ModelSerializer):
    """Job line item serializer"""
    equipment_info = EquipmentSerializer(source='equipment', read_only=True)
    inspections = InspectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobLineItem
        fields = [
            'id', 'job_order', 'equipment', 'equipment_info',
            'type', 'description', 'quantity', 'status',
            'inspections', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobOrderSerializer(serializers.ModelSerializer):
    """Job order serializer"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    line_items = JobLineItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = JobOrder
        fields = [
            'id', 'client', 'client_name', 'po_reference', 'status',
            'site_location', 'scheduled_start', 'scheduled_end',
            'tentative_date', 'notes', 'invoice_number', 'finance_status',
            'line_items', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class JobOrderListSerializer(serializers.ModelSerializer):
    """Simplified job order serializer for list views"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    line_items_count = serializers.IntegerField(source='line_items.count', read_only=True)
    
    class Meta:
        model = JobOrder
        fields = [
            'id', 'client', 'client_name', 'po_reference', 'status',
            'site_location', 'scheduled_start', 'finance_status',
            'line_items_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CertificateSerializer(serializers.ModelSerializer):
    """Certificate serializer"""
    inspection_info = InspectionSerializer(source='inspection', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    public_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'inspection', 'inspection_info', 'generated_by',
            'generated_by_name', 'pdf_file', 'qr_code', 'issued_date',
            'approval_chain', 'status', 'share_link_token', 'public_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'share_link_token', 'created_at', 'updated_at']
    
    def get_public_url(self, obj):
        if obj.status != 'PUBLISHED':
            return None
        base_url = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
        if base_url:
            return f"{base_url}/certificates/public/{obj.share_link_token}"
        return None


class StickerSerializer(serializers.ModelSerializer):
    """Sticker serializer"""
    equipment_info = EquipmentSerializer(source='assigned_equipment', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    
    class Meta:
        model = Sticker
        fields = [
            'id', 'sticker_code', 'qr_payload', 'status',
            'assigned_equipment', 'equipment_info', 'assigned_at',
            'assigned_by', 'assigned_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StickerResolveSerializer(serializers.Serializer):
    """Serializer for sticker resolution response"""
    sticker = StickerSerializer()
    equipment = EquipmentSerializer(required=False, allow_null=True)
    latest_certificate = CertificateSerializer(required=False, allow_null=True)
    inspection_history = InspectionSerializer(many=True, required=False)


class FieldInspectionReportSerializer(serializers.ModelSerializer):
    """Field inspection report serializer"""
    job_order_info = JobOrderListSerializer(source='job_order', read_only=True)
    
    class Meta:
        model = FieldInspectionReport
        fields = [
            'id', 'job_order', 'job_order_info', 'fir_pdf',
            'summary', 'sent_to', 'share_link_token',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'share_link_token', 'created_at', 'updated_at']


class ApprovalSerializer(serializers.ModelSerializer):
    """Approval serializer"""
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    
    class Meta:
        model = Approval
        fields = [
            'id', 'entity_type', 'entity_id', 'approver',
            'approver_name', 'decision', 'comment', 'decided_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PublicationSerializer(serializers.ModelSerializer):
    """Publication serializer"""
    job_order_info = JobOrderListSerializer(source='job_order', read_only=True)
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)
    
    class Meta:
        model = Publication
        fields = [
            'id', 'job_order', 'job_order_info', 'published_by',
            'published_by_name', 'published_at', 'status', 'note',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ToolCategorySerializer(serializers.ModelSerializer):
    """Serializer for tool categories"""

    class Meta:
        model = ToolCategory
        fields = [
            'id', 'code', 'name', 'description', 'requires_calibration',
            'calibration_interval_days', 'default_assignment_type', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ToolSerializer(serializers.ModelSerializer):
    """Tool serializer"""

    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    category_info = ToolCategorySerializer(source='category', read_only=True)
    is_overdue_for_calibration = serializers.BooleanField(read_only=True)

    class Meta:
        model = Tool
        fields = [
            'id', 'name', 'serial_number', 'category', 'category_info',
            'status', 'assignment_mode', 'location', 'calibration_due',
            'assigned_to', 'assigned_to_name', 'is_overdue_for_calibration',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'category_info', 'assigned_to_name', 'is_overdue_for_calibration', 'created_at', 'updated_at']


class CalibrationSerializer(serializers.ModelSerializer):
    """Calibration serializer"""
    tool_info = ToolSerializer(source='tool', read_only=True)
    
    class Meta:
        model = Calibration
        fields = [
            'id', 'tool', 'tool_info', 'calibration_date',
            'next_due', 'certificate_file', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ToolAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for tool assignments"""

    tool_info = ToolSerializer(source='tool', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    job_order_reference = serializers.CharField(source='job_order.po_reference', read_only=True)
    equipment_tag = serializers.CharField(source='equipment.tag_code', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = ToolAssignment
        fields = [
            'id', 'tool', 'tool_info', 'assignment_type', 'status',
            'assigned_user', 'assigned_user_name', 'job_order', 'job_order_reference',
            'equipment', 'equipment_tag', 'client', 'client_name',
            'assigned_on', 'expected_return', 'returned_on', 'notes',
            'created_by', 'updated_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tool_info', 'assigned_user_name', 'job_order_reference',
            'equipment_tag', 'client_name', 'created_by', 'updated_by',
            'created_at', 'updated_at'
        ]


class ToolUsageLogSerializer(serializers.ModelSerializer):
    """Serializer for tool usage logs"""

    tool_info = ToolSerializer(source='tool', read_only=True)
    assignment_info = ToolAssignmentSerializer(source='assignment', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = ToolUsageLog
        fields = [
            'id', 'tool', 'tool_info', 'assignment', 'assignment_info',
            'event_type', 'occurred_at', 'performed_by', 'performed_by_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tool_info', 'assignment_info', 'performed_by_name',
            'created_at', 'updated_at'
        ]


class ToolIncidentSerializer(serializers.ModelSerializer):
    """Serializer for tool incidents"""

    tool_info = ToolSerializer(source='tool', read_only=True)

    class Meta:
        model = ToolIncident
        fields = [
            'id', 'tool', 'tool_info', 'incident_type', 'severity',
            'occurred_on', 'description', 'resolved_on', 'resolution_notes',
            'created_by', 'updated_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tool_info', 'created_by', 'updated_by', 'created_at', 'updated_at']


class CompetenceEvidenceSerializer(serializers.ModelSerializer):
    """Evidence serializer for competence authorizations"""

    class Meta:
        model = CompetenceEvidence
        fields = [
            'id', 'authorization', 'evidence_type', 'issued_by',
            'issued_on', 'reference_code', 'document', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompetenceAuthorizationSerializer(serializers.ModelSerializer):
    """Competence authorization serializer"""

    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    service_code = serializers.CharField(source='service.code', read_only=True)
    evidence_items = CompetenceEvidenceSerializer(many=True, read_only=True)

    class Meta:
        model = CompetenceAuthorization
        fields = [
            'id', 'user', 'user_name', 'service', 'service_code', 'discipline',
            'level', 'scope_notes', 'valid_from', 'valid_until', 'last_assessed',
            'status', 'evidence_items', 'created_by', 'updated_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']


class PersonCredentialSerializer(serializers.ModelSerializer):
    """Serializer for credentials held by a person"""

    class Meta:
        model = PersonCredential
        fields = [
            'id', 'person', 'credential_name', 'issuing_body',
            'reference_code', 'issued_on', 'valid_until', 'status',
            'document', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PersonSerializer(serializers.ModelSerializer):
    """People registry serializer with credential summaries"""

    client_name = serializers.CharField(source='client.name', read_only=True)
    credentials = PersonCredentialSerializer(many=True, read_only=True)

    class Meta:
        model = Person
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'person_type', 'employer', 'client', 'client_name',
            'notes', 'credentials', 'created_by', 'updated_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client_name', 'credentials', 'created_by', 'updated_by', 'created_at', 'updated_at']


class InspectionSubmitSerializer(serializers.Serializer):
    """Serializer for inspection submission"""
    answers = InspectionAnswerSerializer(many=True)
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )
    inspector_signature = serializers.ImageField(required=False)
    client_signature = serializers.ImageField(required=False)


class AssignInspectorSerializer(serializers.Serializer):
    """Serializer for assigning inspector to job order"""
    inspector_id = serializers.IntegerField()
    line_item_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
