# Generated migration for inspections app

from django.conf import settings
import django.contrib.auth.models
import django.contrib.auth.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('role', models.CharField(choices=[('ADMIN', 'Admin'), ('TEAM_LEAD', 'Team Lead'), ('TECHNICAL_MANAGER', 'Technical Manager'), ('INSPECTOR', 'Inspector'), ('CLIENT', 'Client')], default='INSPECTOR', max_length=20)),
                ('competence', models.TextField(blank=True, help_text='Inspector competencies and certifications')),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'db_table': 'users',
                'ordering': ['username'],
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('contact_person', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(max_length=20)),
                ('address', models.TextField()),
                ('billing_reference', models.CharField(blank=True, max_length=100)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'clients',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Equipment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tag_code', models.CharField(db_index=True, max_length=100, unique=True)),
                ('type', models.CharField(help_text='Equipment type (e.g., Crane, Hoist)', max_length=100)),
                ('manufacturer', models.CharField(max_length=255)),
                ('model', models.CharField(max_length=255)),
                ('serial_number', models.CharField(max_length=255)),
                ('swl', models.DecimalField(blank=True, decimal_places=2, help_text='Safe Working Load', max_digits=12, null=True)),
                ('location', models.TextField()),
                ('next_due', models.DateField(blank=True, help_text='Next inspection due date', null=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='equipment', to='inspections.client')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'equipment',
                'verbose_name_plural': 'Equipment',
                'ordering': ['tag_code'],
            },
        ),
        migrations.CreateModel(
            name='JobOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('po_reference', models.CharField(blank=True, help_text='Purchase Order reference', max_length=100)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('SCHEDULED', 'Scheduled'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('PUBLISHED', 'Published'), ('CANCELLED', 'Cancelled')], default='DRAFT', max_length=20)),
                ('site_location', models.TextField()),
                ('scheduled_start', models.DateTimeField(blank=True, null=True)),
                ('scheduled_end', models.DateTimeField(blank=True, null=True)),
                ('tentative_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('invoice_number', models.CharField(blank=True, max_length=100, null=True)),
                ('finance_status', models.CharField(choices=[('PENDING', 'Pending'), ('READY', 'Ready for Invoice'), ('INVOICED', 'Invoiced')], default='PENDING', max_length=20)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='job_orders', to='inspections.client')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'job_orders',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='JobLineItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('type', models.CharField(help_text='Inspection type', max_length=100)),
                ('description', models.TextField()),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('ASSIGNED', 'Assigned'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed')], default='PENDING', max_length=20)),
                ('equipment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='line_items', to='inspections.equipment')),
                ('job_order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='line_items', to='inspections.joborder')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'job_line_items',
                'ordering': ['job_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='Inspection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('checklist_template', models.CharField(blank=True, help_text='Checklist template name', max_length=100)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('IN_PROGRESS', 'In Progress'), ('SUBMITTED', 'Submitted for Review'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='DRAFT', max_length=20)),
                ('geo_location_lat', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('geo_location_lng', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('inspector_signature', models.FileField(blank=True, null=True, upload_to='signatures/')),
                ('client_signature', models.FileField(blank=True, null=True, upload_to='signatures/')),
                ('inspector', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='inspections', to=settings.AUTH_USER_MODEL)),
                ('job_line_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inspections', to='inspections.joblineitem')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'inspections',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='InspectionAnswer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('question_key', models.CharField(help_text='Question identifier', max_length=100)),
                ('result', models.CharField(choices=[('SAFE', 'Safe'), ('NOT_SAFE', 'Not Safe'), ('NA', 'Not Applicable')], max_length=20)),
                ('comment', models.TextField(blank=True)),
                ('inspection', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers', to='inspections.inspection')),
            ],
            options={
                'db_table': 'inspection_answers',
                'ordering': ['inspection', 'question_key'],
                'unique_together': {('inspection', 'question_key')},
            },
        ),
        migrations.CreateModel(
            name='PhotoRef',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('file', models.ImageField(upload_to='inspection_photos/')),
                ('slot_name', models.CharField(help_text='Photo slot identifier (e.g., FRONT, SIDE1)', max_length=50)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('geotag_lat', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('geotag_lng', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('answer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='inspections.inspectionanswer')),
                ('inspection', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='inspections.inspection')),
            ],
            options={
                'db_table': 'photo_refs',
                'ordering': ['inspection', 'slot_name'],
            },
        ),
        migrations.CreateModel(
            name='Certificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pdf_file', models.FileField(upload_to='certificates/')),
                ('qr_code', models.CharField(db_index=True, max_length=255, unique=True)),
                ('issued_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('approval_chain', models.JSONField(default=dict, help_text='Approval history')),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('GENERATED', 'Generated'), ('PUBLISHED', 'Published')], default='DRAFT', max_length=20)),
                ('share_link_token', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('generated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='certificates_generated', to=settings.AUTH_USER_MODEL)),
                ('inspection', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='certificate', to='inspections.inspection')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'certificates',
                'ordering': ['-issued_date'],
            },
        ),
        migrations.CreateModel(
            name='Sticker',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('sticker_code', models.CharField(db_index=True, max_length=50, unique=True)),
                ('qr_payload', models.TextField(help_text='QR code data/URL')),
                ('status', models.CharField(choices=[('AVAILABLE', 'Available'), ('ASSIGNED', 'Assigned'), ('HISTORICAL', 'Historical')], default='AVAILABLE', max_length=20)),
                ('assigned_at', models.DateTimeField(blank=True, null=True)),
                ('assigned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stickers_assigned', to=settings.AUTH_USER_MODEL)),
                ('assigned_equipment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stickers', to='inspections.equipment')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'stickers',
                'ordering': ['sticker_code'],
            },
        ),
        migrations.CreateModel(
            name='FieldInspectionReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('fir_pdf', models.FileField(upload_to='fir_reports/')),
                ('summary', models.TextField()),
                ('sent_to', models.EmailField(blank=True, max_length=254)),
                ('share_link_token', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('job_order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='field_reports', to='inspections.joborder')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'field_inspection_reports',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Approval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('entity_type', models.CharField(choices=[('INSPECTION', 'Inspection'), ('CERTIFICATE', 'Certificate'), ('JOB_ORDER', 'Job Order')], max_length=20)),
                ('entity_id', models.PositiveIntegerField()),
                ('decision', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20)),
                ('comment', models.TextField(blank=True)),
                ('decided_at', models.DateTimeField(blank=True, null=True)),
                ('approver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'approvals',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Publication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('REVOKED', 'Revoked')], default='DRAFT', max_length=20)),
                ('note', models.TextField(blank=True)),
                ('job_order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='publications', to='inspections.joborder')),
                ('published_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='publications', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'publications',
                'ordering': ['-published_at'],
            },
        ),
        migrations.CreateModel(
            name='Tool',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('serial_number', models.CharField(max_length=255, unique=True)),
                ('calibration_due', models.DateField(blank=True, null=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tools', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'tools',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Calibration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('calibration_date', models.DateField()),
                ('next_due', models.DateField()),
                ('certificate_file', models.FileField(blank=True, null=True, upload_to='calibration_certificates/')),
                ('notes', models.TextField(blank=True)),
                ('tool', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calibrations', to='inspections.tool')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'calibrations',
                'ordering': ['-calibration_date'],
            },
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Delete'), ('APPROVE', 'Approve'), ('REJECT', 'Reject'), ('PUBLISH', 'Publish'), ('REVOKE', 'Revoke')], max_length=20)),
                ('entity_type', models.CharField(max_length=50)),
                ('entity_id', models.PositiveIntegerField()),
                ('changes', models.JSONField(default=dict, help_text='Changed fields and values')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'audit_logs',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['name'], name='clients_name_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['email'], name='clients_email_idx'),
        ),
        migrations.AddIndex(
            model_name='equipment',
            index=models.Index(fields=['tag_code'], name='equipment_tag_code_idx'),
        ),
        migrations.AddIndex(
            model_name='equipment',
            index=models.Index(fields=['serial_number'], name='equipment_serial_number_idx'),
        ),
        migrations.AddIndex(
            model_name='equipment',
            index=models.Index(fields=['client', 'next_due'], name='equipment_client_next_due_idx'),
        ),
        migrations.AddIndex(
            model_name='joborder',
            index=models.Index(fields=['client', 'status'], name='job_orders_client_status_idx'),
        ),
        migrations.AddIndex(
            model_name='joborder',
            index=models.Index(fields=['status', 'scheduled_start'], name='job_orders_status_scheduled_start_idx'),
        ),
        migrations.AddIndex(
            model_name='inspection',
            index=models.Index(fields=['inspector', 'status'], name='inspections_inspector_status_idx'),
        ),
        migrations.AddIndex(
            model_name='inspection',
            index=models.Index(fields=['status', 'created_at'], name='inspections_status_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='photoref',
            index=models.Index(fields=['inspection', 'slot_name'], name='photo_refs_inspection_slot_name_idx'),
        ),
        migrations.AddIndex(
            model_name='certificate',
            index=models.Index(fields=['qr_code'], name='certificates_qr_code_idx'),
        ),
        migrations.AddIndex(
            model_name='certificate',
            index=models.Index(fields=['share_link_token'], name='certificates_share_link_token_idx'),
        ),
        migrations.AddIndex(
            model_name='sticker',
            index=models.Index(fields=['sticker_code'], name='stickers_sticker_code_idx'),
        ),
        migrations.AddIndex(
            model_name='sticker',
            index=models.Index(fields=['status'], name='stickers_status_idx'),
        ),
        migrations.AddIndex(
            model_name='approval',
            index=models.Index(fields=['entity_type', 'entity_id'], name='approvals_entity_type_entity_id_idx'),
        ),
        migrations.AddIndex(
            model_name='approval',
            index=models.Index(fields=['approver', 'decision'], name='approvals_approver_decision_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['entity_type', 'entity_id'], name='audit_logs_entity_type_entity_id_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['user', 'timestamp'], name='audit_logs_user_timestamp_idx'),
        ),
    ]
