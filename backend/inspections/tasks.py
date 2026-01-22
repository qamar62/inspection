from celery import shared_task
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from weasyprint import HTML
import qrcode
from io import BytesIO
from PIL import Image
import os


@shared_task
def generate_certificate_task(inspection_id, user_id, with_letterhead=True):
    """Generate certificate PDF for an approved inspection"""
    from .models import Inspection, Certificate, User
    from django.core.files.base import ContentFile
    import base64
    
    try:
        inspection = Inspection.objects.select_related(
            'job_line_item__equipment__client',
            'job_line_item__job_order',
            'inspector'
        ).prefetch_related('answers', 'photos').get(id=inspection_id)
        
        user = User.objects.get(id=user_id)
        
        # Generate unique certificate code
        cert_year = timezone.now().year
        cert_number = f"{cert_year}{str(inspection.id).zfill(8)}"
        qr_code_data = f"CERT-{cert_number}"
        
        # Generate QR code with verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify/{qr_code_data}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Convert QR code to base64 for embedding in HTML
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode()
        
        # Determine if inspection is safe
        is_safe = True
        for answer in inspection.answers.all():
            if answer.result == 'NOT_SAFE':
                is_safe = False
                break
        
        # Get approver name
        approver_name = user.get_full_name() or user.username
        
        # Prepare context for template
        context = {
            'inspection': inspection,
            'certificate': {
                'qr_code': qr_code_data,
                'issued_date': timezone.now(),
            },
            'is_safe': is_safe,
            'approver_name': approver_name,
            'qr_code_base64': qr_base64,
            'verification_url': verification_url,
            'with_letterhead': with_letterhead,
            'company_name': settings.COMPANY_NAME,
            'company_full_name': settings.COMPANY_FULL_NAME,
            'company_division': settings.COMPANY_DIVISION,
        }
        
        # Render HTML template
        html_string = render_to_string('certificate.html', context)
        
        # Generate PDF
        pdf_file = HTML(string=html_string).write_pdf()
        
        # Create certificate record
        certificate = Certificate.objects.create(
            inspection=inspection,
            generated_by=user,
            qr_code=qr_code_data,
            issued_date=timezone.now(),
            approval_chain={
                'generated_by': user.username,
                'generated_at': timezone.now().isoformat(),
                'is_safe': is_safe,
            },
            status='GENERATED',
            created_by=user
        )
        
        # Save PDF file to MinIO/S3
        pdf_filename = f'certificates/cert_{qr_code_data}.pdf'
        certificate.pdf_file.save(pdf_filename, ContentFile(pdf_file), save=True)
        
        return {
            'success': True,
            'certificate_id': certificate.id,
            'qr_code': qr_code_data,
            'pdf_url': certificate.pdf_file.url if certificate.pdf_file else None,
            'message': 'Certificate generated successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def send_certificate_email(certificate_id, recipient_email):
    """Send certificate via email"""
    from .models import Certificate
    
    try:
        certificate = Certificate.objects.select_related(
            'inspection__job_line_item__job_order__client'
        ).get(id=certificate_id)
        
        job_order = certificate.inspection.job_line_item.job_order
        client = job_order.client
        
        subject = f'Inspection Certificate - {job_order.po_reference}'
        
        context = {
            'certificate': certificate,
            'job_order': job_order,
            'client': client,
            'public_url': f"{settings.FRONTEND_URL}/certificates/public/{certificate.share_link_token}"
        }
        
        html_message = render_to_string('emails/certificate_email.html', context)
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.content_subtype = 'html'
        
        # Attach PDF
        if certificate.pdf_file:
            email.attach_file(certificate.pdf_file.path)
        
        email.send()
        
        return {
            'success': True,
            'message': f'Email sent to {recipient_email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def send_fir_email(fir_id, recipient_email):
    """Send Field Inspection Report via email"""
    from .models import FieldInspectionReport
    
    try:
        fir = FieldInspectionReport.objects.select_related(
            'job_order__client'
        ).get(id=fir_id)
        
        subject = f'Field Inspection Report - {fir.job_order.po_reference}'
        
        context = {
            'fir': fir,
            'job_order': fir.job_order,
            'client': fir.job_order.client,
            'share_url': f"{settings.FRONTEND_URL}/fir/public/{fir.share_link_token}"
        }
        
        html_message = render_to_string('emails/fir_email.html', context)
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.content_subtype = 'html'
        
        # Attach PDF
        if fir.fir_pdf:
            email.attach_file(fir.fir_pdf.path)
        
        email.send()
        
        # Update FIR record
        fir.sent_to = recipient_email
        fir.save()
        
        return {
            'success': True,
            'message': f'FIR sent to {recipient_email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def generate_inspection_report(job_order_id):
    """Generate consolidated inspection report for a job order"""
    from .models import JobOrder, FieldInspectionReport, Inspection
    from django.core.files.base import ContentFile
    
    try:
        job_order = JobOrder.objects.select_related('client').prefetch_related(
            'line_items__inspections__answers',
            'line_items__equipment'
        ).get(id=job_order_id)
        
        inspections = Inspection.objects.filter(
            job_line_item__job_order=job_order
        ).select_related('inspector', 'job_line_item__equipment')
        
        context = {
            'job_order': job_order,
            'client': job_order.client,
            'inspections': inspections,
            'generated_at': timezone.now(),
        }
        
        # Render HTML template
        html_string = render_to_string('reports/fir_template.html', context)
        
        # Generate PDF
        pdf_file = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()
        
        # Create summary
        summary = f"Field Inspection Report for {job_order.po_reference}. "
        summary += f"Total inspections: {inspections.count()}. "
        summary += f"Approved: {inspections.filter(status='APPROVED').count()}, "
        summary += f"Pending: {inspections.filter(status='SUBMITTED').count()}."
        
        # Create FIR record
        fir = FieldInspectionReport.objects.create(
            job_order=job_order,
            summary=summary,
            created_by_id=job_order.created_by_id
        )
        
        # Save PDF file
        pdf_filename = f'fir_{job_order.id}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        fir.fir_pdf.save(pdf_filename, ContentFile(pdf_file), save=True)
        
        return {
            'success': True,
            'fir_id': fir.id,
            'message': 'FIR generated successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def cleanup_old_drafts():
    """Clean up old draft inspections (older than 30 days)"""
    from .models import Inspection
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=30)
    
    old_drafts = Inspection.objects.filter(
        status='DRAFT',
        created_at__lt=cutoff_date
    )
    
    count = old_drafts.count()
    old_drafts.delete()
    
    return {
        'success': True,
        'deleted_count': count,
        'message': f'Deleted {count} old draft inspections'
    }


@shared_task
def send_due_inspection_reminders():
    """Send reminders for equipment due for inspection"""
    from .models import Equipment
    from datetime import timedelta
    
    today = timezone.now().date()
    reminder_date = today + timedelta(days=7)  # 7 days before due
    
    equipment_due = Equipment.objects.filter(
        next_due=reminder_date
    ).select_related('client')
    
    # Group by client
    clients_equipment = {}
    for eq in equipment_due:
        if eq.client.email not in clients_equipment:
            clients_equipment[eq.client.email] = {
                'client': eq.client,
                'equipment': []
            }
        clients_equipment[eq.client.email]['equipment'].append(eq)
    
    # Send emails
    emails_sent = 0
    for email, data in clients_equipment.items():
        try:
            context = {
                'client': data['client'],
                'equipment_list': data['equipment'],
                'due_date': reminder_date
            }
            
            html_message = render_to_string('emails/inspection_reminder.html', context)
            
            email_obj = EmailMessage(
                subject='Inspection Due Reminder',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            email_obj.content_subtype = 'html'
            email_obj.send()
            emails_sent += 1
        except Exception as e:
            print(f"Failed to send reminder to {email}: {str(e)}")
    
    return {
        'success': True,
        'emails_sent': emails_sent,
        'message': f'Sent {emails_sent} reminder emails'
    }
