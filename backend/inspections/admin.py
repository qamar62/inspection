from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Client, Equipment, JobOrder, JobLineItem,
    Inspection, InspectionAnswer, PhotoRef, Certificate,
    Sticker, FieldInspectionReport, Approval, Publication,
    Tool, Calibration, AuditLog
)

# Customize Django Admin Site
admin.site.site_header = "Times United Backend"
admin.site.site_title = "Times United Admin"
admin.site.index_title = "Inspection Division Management"


@admin.register(User)
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


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'contact_person', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_person', 'email', 'billing_reference']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'tag_code', 'type', 'client', 'manufacturer', 'model', 'next_due']
    list_filter = ['type', 'client', 'next_due']
    search_fields = ['tag_code', 'serial_number', 'manufacturer', 'model']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'next_due'


@admin.register(JobOrder)
class JobOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'status', 'finance_status', 'scheduled_start', 'created_at']
    list_filter = ['status', 'finance_status', 'scheduled_start']
    search_fields = ['po_reference', 'client__name', 'site_location']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'scheduled_start'


@admin.register(JobLineItem)
class JobLineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'equipment', 'type', 'quantity', 'status']
    list_filter = ['status', 'type']
    search_fields = ['job_order__po_reference', 'equipment__tag_code', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_line_item', 'inspector', 'status', 'start_time', 'end_time']
    list_filter = ['status', 'start_time', 'inspector']
    search_fields = ['job_line_item__job_order__po_reference', 'inspector__username']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'start_time'


@admin.register(InspectionAnswer)
class InspectionAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'question_key', 'result', 'created_at']
    list_filter = ['result', 'created_at']
    search_fields = ['inspection__id', 'question_key', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PhotoRef)
class PhotoRefAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'slot_name', 'uploaded_at']
    list_filter = ['slot_name', 'uploaded_at']
    search_fields = ['inspection__id', 'slot_name']
    readonly_fields = ['uploaded_at']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['id', 'inspection', 'qr_code', 'status', 'issued_date', 'generated_by']
    list_filter = ['status', 'issued_date']
    search_fields = ['qr_code', 'inspection__id']
    readonly_fields = ['created_at', 'updated_at', 'share_link_token']
    date_hierarchy = 'issued_date'


@admin.register(Sticker)
class StickerAdmin(admin.ModelAdmin):
    list_display = ['id', 'sticker_code', 'status', 'assigned_equipment', 'assigned_at', 'assigned_by']
    list_filter = ['status', 'assigned_at']
    search_fields = ['sticker_code', 'assigned_equipment__tag_code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FieldInspectionReport)
class FieldInspectionReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'sent_to', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job_order__po_reference', 'sent_to', 'summary']
    readonly_fields = ['created_at', 'updated_at', 'share_link_token']


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ['id', 'entity_type', 'entity_id', 'approver', 'decision', 'decided_at']
    list_filter = ['entity_type', 'decision', 'decided_at']
    search_fields = ['entity_id', 'approver__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_order', 'status', 'published_by', 'published_at']
    list_filter = ['status', 'published_at']
    search_fields = ['job_order__po_reference', 'note']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'serial_number', 'calibration_due', 'assigned_to']
    list_filter = ['calibration_due', 'assigned_to']
    search_fields = ['name', 'serial_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Calibration)
class CalibrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'tool', 'calibration_date', 'next_due']
    list_filter = ['calibration_date', 'next_due']
    search_fields = ['tool__name', 'tool__serial_number']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'calibration_date'


@admin.register(AuditLog)
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
