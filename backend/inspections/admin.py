from django.contrib import admin
from django.conf import settings
from collections import OrderedDict
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Client, Equipment, JobOrder, JobLineItem,
    Inspection, InspectionAnswer, PhotoRef, Certificate,
    Sticker, FieldInspectionReport, Approval, Publication,
    Tool, Calibration, AuditLog, CompetenceAuthorization,
    CompetenceEvidence, Person, PersonCredential, Service,
    ServiceVersion
)

# Customize Django Admin Site grouping


class InspectionAdminSite(admin.AdminSite):
    site_header = "Times United Backend"
    site_title = "Times United Admin"
    index_title = "Inspection Division Management"

    @staticmethod
    def _normalize(value: str) -> str:
        return ''.join(ch for ch in (value or '').lower() if ch.isalnum())

    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        sections = getattr(settings, 'ADMIN_SECTIONS', [])

        section_lookup = {}
        ordered_sections = OrderedDict()
        for section_name, identifiers in sections:
            ordered_sections[section_name] = {
                'name': section_name,
                'app_label': self._normalize(section_name) or 'section',
                'app_url': '',
                'has_module_perms': True,
                'models': [],
            }
            for identifier in identifiers:
                key = self._normalize(identifier)
                if key:
                    section_lookup[key] = section_name

        other_section_name = "Other"
        other_section = {
            'name': other_section_name,
            'app_label': self._normalize(other_section_name) or 'other',
            'app_url': '',
            'has_module_perms': True,
            'models': [],
        }

        for app in app_list:
            models = sorted(app['models'], key=lambda m: m['name'])
            app_label = app.get('app_label') or app.get('name') or ''
            for model in models:
                candidates = [
                    self._normalize(model.get('object_name')),
                    self._normalize(model.get('name')),
                    self._normalize(f"{app_label}.{model.get('object_name')}") if model.get('object_name') else '',
                ]
                section_name = next((section_lookup[key] for key in candidates if key and key in section_lookup), None)
                target_section = ordered_sections.get(section_name) if section_name else None
                if not target_section:
                    target_section = other_section
                target_section['models'].append(model.copy())

        app_sections = [section for section in ordered_sections.values() if section['models']]
        if other_section['models']:
            app_sections.append(other_section)
        return app_sections


inspection_admin_site = InspectionAdminSite()


@admin.register(User, site=inspection_admin_site)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'competence', 'phone')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'competence', 'phone')}),
    )


@admin.register(Client, site=inspection_admin_site)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'contact_person', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_person', 'email', 'billing_reference']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(Service, site=inspection_admin_site)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name_en', 'category', 'status', 'discipline']
    list_filter = ['category', 'status']
    search_fields = ['code', 'name_en', 'name_ar', 'discipline']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(ServiceVersion, site=inspection_admin_site)
class ServiceVersionAdmin(admin.ModelAdmin):
    list_display = ['id', 'service', 'version_number', 'effective_date', 'is_published']
    list_filter = ['is_published', 'effective_date']
    search_fields = ['service__code', 'service__name_en', 'notes']
    autocomplete_fields = ['service']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(Equipment, site=inspection_admin_site)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'tag_code', 'type', 'client', 'manufacturer', 'model', 'next_due']
    list_filter = ['type', 'client', 'next_due']
    search_fields = ['tag_code', 'serial_number', 'manufacturer', 'model']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'next_due'


@admin.register(JobOrder, site=inspection_admin_site)
class JobOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'status', 'finance_status', 'scheduled_start', 'created_at']
    list_filter = ['status', 'finance_status', 'scheduled_start']
    search_fields = ['po_reference', 'client__name', 'site_location']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'scheduled_start'


@admin.register(JobLineItem, site=inspection_admin_site)
class JobLineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'equipment', 'type', 'quantity', 'status']
    list_filter = ['status', 'type']
    search_fields = ['job_order__po_reference', 'equipment__tag_code', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Inspection, site=inspection_admin_site)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_line_item', 'inspector', 'status', 'start_time', 'end_time']
    list_filter = ['status', 'start_time', 'inspector']
    search_fields = ['job_line_item__job_order__po_reference', 'inspector__username']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'start_time'


@admin.register(InspectionAnswer, site=inspection_admin_site)
class InspectionAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'question_key', 'result', 'created_at']
    list_filter = ['result', 'created_at']
    search_fields = ['inspection__id', 'question_key', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PhotoRef, site=inspection_admin_site)
class PhotoRefAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'slot_name', 'uploaded_at']
    list_filter = ['slot_name', 'uploaded_at']
    search_fields = ['inspection__id', 'slot_name']
    readonly_fields = ['uploaded_at']


@admin.register(Certificate, site=inspection_admin_site)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'qr_code', 'status', 'issued_date', 'generated_by']
    list_filter = ['status', 'issued_date']
    search_fields = ['qr_code', 'inspection__id']
    readonly_fields = ['created_at', 'updated_at', 'share_link_token']
    date_hierarchy = 'issued_date'


@admin.register(Sticker, site=inspection_admin_site)
class StickerAdmin(admin.ModelAdmin):
    list_display = ['id', 'sticker_code', 'status', 'assigned_equipment', 'assigned_at', 'assigned_by']
    list_filter = ['status', 'assigned_at']
    search_fields = ['sticker_code', 'assigned_equipment__tag_code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FieldInspectionReport, site=inspection_admin_site)
class FieldInspectionReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'sent_to', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job_order__po_reference', 'sent_to', 'summary']
    readonly_fields = ['created_at', 'updated_at', 'share_link_token']


@admin.register(Approval, site=inspection_admin_site)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ['id', 'entity_type', 'entity_id', 'approver', 'decision', 'decided_at']
    list_filter = ['entity_type', 'decision', 'decided_at']
    search_fields = ['entity_id', 'approver__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Publication, site=inspection_admin_site)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'status', 'published_by', 'published_at']
    list_filter = ['status', 'published_at']
    search_fields = ['job_order__po_reference', 'note']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Tool, site=inspection_admin_site)
class ToolAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'serial_number', 'calibration_due', 'assigned_to']
    list_filter = ['calibration_due', 'assigned_to']
    search_fields = ['name', 'serial_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Calibration, site=inspection_admin_site)
class CalibrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'tool', 'calibration_date', 'next_due']
    list_filter = ['calibration_date', 'next_due']
    search_fields = ['tool__name', 'tool__serial_number']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'calibration_date'


@admin.register(AuditLog, site=inspection_admin_site)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'action', 'entity_type', 'entity_id', 'timestamp']
    list_filter = ['action', 'entity_type', 'timestamp']
    search_fields = ['user__username', 'entity_type', 'entity_id']
    readonly_fields = ['user', 'action', 'entity_type', 'entity_id', 'changes', 'ip_address', 'timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CompetenceAuthorization, site=inspection_admin_site)
class CompetenceAuthorizationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'service', 'discipline', 'level', 'status', 'valid_from', 'valid_until']
    list_filter = ['status', 'level', 'valid_from', 'valid_until', 'service']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'discipline', 'service__code']
    autocomplete_fields = ['user', 'service']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(CompetenceEvidence, site=inspection_admin_site)
class CompetenceEvidenceAdmin(admin.ModelAdmin):
    list_display = ['id', 'authorization', 'evidence_type', 'issued_by', 'issued_on']
    list_filter = ['evidence_type', 'issued_on']
    search_fields = ['authorization__user__username', 'issued_by', 'reference_code']
    autocomplete_fields = ['authorization']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Person, site=inspection_admin_site)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'person_type', 'employer', 'client']
    list_filter = ['person_type', 'client']
    search_fields = ['first_name', 'last_name', 'email', 'employer']
    autocomplete_fields = ['client']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(PersonCredential, site=inspection_admin_site)
class PersonCredentialAdmin(admin.ModelAdmin):
    list_display = ['id', 'person', 'credential_name', 'status', 'issued_on', 'valid_until']
    list_filter = ['status', 'issued_on', 'valid_until']
    search_fields = ['person__first_name', 'person__last_name', 'credential_name', 'reference_code']
    autocomplete_fields = ['person']
    readonly_fields = ['created_at', 'updated_at']
