from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import (
    Inspection, Certificate, JobOrder, Approval, Publication, AuditLog
)


@receiver(post_save, sender=Inspection)
def log_inspection_changes(sender, instance, created, **kwargs):
    """Log inspection creation and updates"""
    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    AuditLog.objects.create(
        user=instance.updated_by or instance.created_by,
        action=action,
        entity_type='Inspection',
        entity_id=instance.id,
        changes={'status': instance.status}
    )


@receiver(post_save, sender=Approval)
def log_approval_decision(sender, instance, created, **kwargs):
    """Log approval decisions"""
    if instance.decision in ['APPROVED', 'REJECTED']:
        action = AuditLog.Action.APPROVE if instance.decision == 'APPROVED' else AuditLog.Action.REJECT
        AuditLog.objects.create(
            user=instance.approver,
            action=action,
            entity_type=instance.entity_type,
            entity_id=instance.entity_id,
            changes={'decision': instance.decision, 'comment': instance.comment}
        )


@receiver(post_save, sender=Publication)
def log_publication(sender, instance, created, **kwargs):
    """Log publication events"""
    if instance.status == 'PUBLISHED':
        AuditLog.objects.create(
            user=instance.published_by,
            action=AuditLog.Action.PUBLISH,
            entity_type='JobOrder',
            entity_id=instance.job_order.id,
            changes={'status': instance.status, 'note': instance.note}
        )
