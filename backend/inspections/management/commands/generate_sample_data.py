"""
Django management command to generate sample data for testing
Usage: python manage.py generate_sample_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from inspections.models import (
    Client, Equipment, JobOrder, JobLineItem, Inspection,
    InspectionAnswer, PhotoRef, Certificate, Sticker,
    FieldInspectionReport, Approval, Publication, Tool, Calibration
)
from faker import Faker
import random
from datetime import timedelta
from decimal import Decimal

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    help = 'Generate sample data for testing the Inspection SaaS application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before generating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('Starting sample data generation...'))

        # Create users
        users = self.create_users()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(users)} users'))

        # Create clients
        clients = self.create_clients(users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(clients)} clients'))

        # Create equipment
        equipment_list = self.create_equipment(clients, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(equipment_list)} equipment items'))

        # Create tools
        tools = self.create_tools(users['inspectors'], users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(tools)} tools'))

        # Create calibrations
        calibrations = self.create_calibrations(tools, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(calibrations)} calibrations'))

        # Create stickers
        stickers = self.create_stickers(equipment_list, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(stickers)} stickers'))

        # Create job orders
        job_orders = self.create_job_orders(clients, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(job_orders)} job orders'))

        # Create job line items
        line_items = self.create_job_line_items(job_orders, equipment_list, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(line_items)} job line items'))

        # Create inspections
        inspections = self.create_inspections(line_items, users['inspectors'], users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(inspections)} inspections'))

        # Create inspection answers
        answers = self.create_inspection_answers(inspections)
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(answers)} inspection answers'))

        # Create certificates
        certificates = self.create_certificates(inspections, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(certificates)} certificates'))

        # Create approvals
        approvals = self.create_approvals(inspections, users['managers'], users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(approvals)} approvals'))

        # Create publications
        publications = self.create_publications(job_orders, users['admin'])
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(publications)} publications'))

        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('Sample data generation completed successfully!'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(self.style.SUCCESS('\nLogin Credentials:'))
        self.stdout.write(self.style.SUCCESS('  Admin: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('  Inspector: inspector1 / inspector123'))
        self.stdout.write(self.style.SUCCESS('  Manager: manager1 / manager123'))
        self.stdout.write(self.style.SUCCESS('  Team Lead: teamlead1 / teamlead123'))
        self.stdout.write(self.style.SUCCESS('  Client: client1 / client123'))

    def clear_data(self):
        """Clear all existing data except superuser"""
        Publication.objects.all().delete()
        Approval.objects.all().delete()
        Calibration.objects.all().delete()
        Tool.objects.all().delete()
        FieldInspectionReport.objects.all().delete()
        Certificate.objects.all().delete()
        PhotoRef.objects.all().delete()
        InspectionAnswer.objects.all().delete()
        Inspection.objects.all().delete()
        JobLineItem.objects.all().delete()
        JobOrder.objects.all().delete()
        Sticker.objects.all().delete()
        Equipment.objects.all().delete()
        Client.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """Create users with different roles"""
        users = {
            'admin': None,
            'inspectors': [],
            'managers': [],
            'team_leads': [],
            'clients': []
        }

        # Create or get admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@inspection-saas.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
        users['admin'] = admin

        # Create inspectors
        for i in range(1, 6):
            inspector, created = User.objects.get_or_create(
                username=f'inspector{i}',
                defaults={
                    'email': f'inspector{i}@inspection-saas.com',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'role': 'INSPECTOR',
                    'competence': f'Certified Inspector - {random.choice(["Cranes", "Hoists", "Lifting Equipment", "General"])} - {random.randint(3, 15)} years experience',
                    'phone': fake.phone_number()[:20],
                }
            )
            if created:
                inspector.set_password('inspector123')
                inspector.save()
            users['inspectors'].append(inspector)

        # Create technical managers
        for i in range(1, 3):
            manager, created = User.objects.get_or_create(
                username=f'manager{i}',
                defaults={
                    'email': f'manager{i}@inspection-saas.com',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'role': 'TECHNICAL_MANAGER',
                    'phone': fake.phone_number()[:20],
                }
            )
            if created:
                manager.set_password('manager123')
                manager.save()
            users['managers'].append(manager)

        # Create team leads
        for i in range(1, 3):
            lead, created = User.objects.get_or_create(
                username=f'teamlead{i}',
                defaults={
                    'email': f'teamlead{i}@inspection-saas.com',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'role': 'TEAM_LEAD',
                    'phone': fake.phone_number()[:20],
                }
            )
            if created:
                lead.set_password('teamlead123')
                lead.save()
            users['team_leads'].append(lead)

        # Create client users
        for i in range(1, 4):
            client_user, created = User.objects.get_or_create(
                username=f'client{i}',
                defaults={
                    'email': f'client{i}@example.com',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'role': 'CLIENT',
                    'phone': fake.phone_number()[:20],
                }
            )
            if created:
                client_user.set_password('client123')
                client_user.save()
            users['clients'].append(client_user)

        return users

    def create_clients(self, created_by):
        """Create client companies"""
        clients = []
        
        company_types = [
            'Manufacturing', 'Construction', 'Oil & Gas', 'Logistics',
            'Marine', 'Aviation', 'Industrial', 'Engineering'
        ]
        
        for i in range(20):
            client = Client.objects.create(
                name=f"{fake.company()} {random.choice(company_types)}",
                contact_person=fake.name(),
                email=fake.company_email(),
                phone=fake.phone_number()[:20],
                address=f"{fake.street_address()}, {fake.city()}, UAE",
                billing_reference=f"BIL-{fake.year()}-{fake.random_number(digits=4, fix_len=True)}",
                is_active=random.choice([True, True, True, False]),  # 75% active
                created_by=created_by
            )
            clients.append(client)
        
        return clients

    def create_equipment(self, clients, created_by):
        """Create equipment items"""
        equipment_list = []
        
        equipment_types = [
            ('Overhead Crane', ['Konecranes', 'Demag', 'GH Cranes', 'Verlinde']),
            ('Mobile Crane', ['Liebherr', 'Terex', 'Tadano', 'Grove']),
            ('Chain Hoist', ['Yale', 'CM', 'Kito', 'Harrington']),
            ('Wire Rope Hoist', ['Demag', 'Street', 'R&M', 'Verlinde']),
            ('Gantry Crane', ['Konecranes', 'ZPMC', 'Liebherr', 'Sany']),
            ('Jib Crane', ['Gorbel', 'Spanco', 'Demag', 'Verlinde']),
            ('Forklift', ['Toyota', 'Hyster', 'Crown', 'Linde']),
            ('Lifting Beam', ['Modulift', 'Caldwell', 'Tandemloc', 'Peerless']),
        ]
        
        for i in range(50):
            eq_type, manufacturers = random.choice(equipment_types)
            manufacturer = random.choice(manufacturers)
            
            equipment = Equipment.objects.create(
                client=random.choice(clients),
                tag_code=f"{eq_type[:2].upper()}-{fake.random_number(digits=3, fix_len=True)}-{fake.year()}",
                type=eq_type,
                manufacturer=manufacturer,
                model=f"{manufacturer[:3].upper()}-{fake.random_number(digits=3, fix_len=True)}",
                serial_number=f"SN-{fake.year()}-{fake.random_number(digits=6, fix_len=True)}",
                swl=Decimal(random.choice([1, 2, 3, 5, 10, 15, 20, 25, 30, 50, 100])),
                location=f"{random.choice(['Warehouse', 'Workshop', 'Site', 'Yard', 'Building'])} {fake.random_letter().upper()}, {random.choice(['Bay', 'Zone', 'Area', 'Section'])} {random.randint(1, 20)}",
                next_due=timezone.now().date() + timedelta(days=random.randint(-30, 365)),
                created_by=created_by
            )
            equipment_list.append(equipment)
        
        return equipment_list

    def create_tools(self, inspectors, created_by):
        """Create inspection tools"""
        tools = []
        
        tool_types = [
            'Load Cell', 'Torque Wrench', 'Multimeter', 'Thickness Gauge',
            'Crack Detector', 'Hardness Tester', 'Pressure Gauge', 'Caliper'
        ]
        
        for i in range(15):
            tool = Tool.objects.create(
                name=random.choice(tool_types),
                serial_number=f"TOOL-{fake.year()}-{fake.random_number(digits=5, fix_len=True)}",
                calibration_due=timezone.now().date() + timedelta(days=random.randint(-30, 365)),
                assigned_to=random.choice(inspectors) if random.random() > 0.3 else None,
                created_by=created_by
            )
            tools.append(tool)
        
        return tools

    def create_calibrations(self, tools, created_by):
        """Create calibration records"""
        calibrations = []
        
        for tool in tools:
            # Create 1-3 calibration records per tool
            for _ in range(random.randint(1, 3)):
                cal_date = fake.date_between(start_date='-2y', end_date='today')
                calibration = Calibration.objects.create(
                    tool=tool,
                    calibration_date=cal_date,
                    next_due=cal_date + timedelta(days=365),
                    notes=f"Calibrated by {fake.company()}. Certificate: CAL-{fake.random_number(digits=6, fix_len=True)}",
                    created_by=created_by
                )
                calibrations.append(calibration)
        
        return calibrations

    def create_stickers(self, equipment_list, created_by):
        """Create QR stickers"""
        stickers = []
        
        for i in range(30):
            sticker_code = f"TUVINSP-{str(i+1).zfill(6)}"
            equipment = random.choice(equipment_list) if random.random() > 0.3 else None
            
            sticker = Sticker.objects.create(
                sticker_code=sticker_code,
                qr_payload=f"https://inspection-saas.com/sticker/{sticker_code}",
                status='ASSIGNED' if equipment else 'AVAILABLE',
                assigned_equipment=equipment,
                assigned_at=timezone.now() if equipment else None,
                assigned_by=created_by if equipment else None,
                created_by=created_by
            )
            stickers.append(sticker)
        
        return stickers

    def create_job_orders(self, clients, created_by):
        """Create job orders"""
        job_orders = []
        
        statuses = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED']
        
        for i in range(25):
            status = random.choice(statuses)
            scheduled_date = fake.date_time_between(start_date='-30d', end_date='+60d', tzinfo=timezone.get_current_timezone())
            
            job_order = JobOrder.objects.create(
                client=random.choice(clients),
                po_reference=f"PO-{fake.year()}-{fake.random_number(digits=4, fix_len=True)}",
                status=status,
                site_location=f"{fake.street_address()}, {fake.city()}, UAE",
                scheduled_start=scheduled_date if status != 'DRAFT' else None,
                scheduled_end=scheduled_date + timedelta(hours=random.randint(4, 12)) if status != 'DRAFT' else None,
                tentative_date=scheduled_date.date() if status == 'DRAFT' else None,
                notes=fake.text(max_nb_chars=200),
                finance_status=random.choice(['PENDING', 'READY', 'INVOICED']) if status in ['COMPLETED', 'PUBLISHED'] else 'PENDING',
                invoice_number=f"INV-{fake.random_number(digits=6, fix_len=True)}" if status == 'PUBLISHED' else None,
                created_by=created_by
            )
            job_orders.append(job_order)
        
        return job_orders

    def create_job_line_items(self, job_orders, equipment_list, created_by):
        """Create job line items"""
        line_items = []
        
        inspection_types = [
            'Annual Inspection', 'Pre-operational Inspection', 'Periodic Inspection',
            'Thorough Examination', 'Load Test', 'NDT Inspection', 'Maintenance Inspection'
        ]
        
        for job_order in job_orders:
            # Create 1-5 line items per job order
            num_items = random.randint(1, 5)
            for _ in range(num_items):
                line_item = JobLineItem.objects.create(
                    job_order=job_order,
                    equipment=random.choice(equipment_list) if random.random() > 0.2 else None,
                    type=random.choice(inspection_types),
                    description=fake.text(max_nb_chars=150),
                    quantity=random.randint(1, 3),
                    status=random.choice(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']),
                    created_by=created_by
                )
                line_items.append(line_item)
        
        return line_items

    def create_inspections(self, line_items, inspectors, created_by):
        """Create inspections"""
        inspections = []
        
        statuses = ['DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED']
        
        for line_item in line_items[:40]:  # Create inspections for first 40 line items
            status = random.choice(statuses)
            start_time = fake.date_time_between(start_date='-60d', end_date='now', tzinfo=timezone.get_current_timezone())
            
            inspection = Inspection.objects.create(
                job_line_item=line_item,
                inspector=random.choice(inspectors),
                checklist_template=random.choice(['CRANE_CHECKLIST', 'HOIST_CHECKLIST', 'GENERAL_CHECKLIST']),
                start_time=start_time if status != 'DRAFT' else None,
                end_time=start_time + timedelta(hours=random.randint(1, 4)) if status in ['SUBMITTED', 'APPROVED', 'REJECTED'] else None,
                status=status,
                geo_location_lat=Decimal(str(round(random.uniform(24.0, 26.0), 6))) if status != 'DRAFT' else None,
                geo_location_lng=Decimal(str(round(random.uniform(54.0, 56.0), 6))) if status != 'DRAFT' else None,
                created_by=created_by
            )
            inspections.append(inspection)
        
        return inspections

    def create_inspection_answers(self, inspections):
        """Create inspection answers"""
        answers = []
        
        questions = [
            'VISUAL_CONDITION', 'STRUCTURAL_INTEGRITY', 'LOAD_TEST_RESULT',
            'SAFETY_DEVICES', 'ELECTRICAL_SYSTEM', 'HYDRAULIC_SYSTEM',
            'MECHANICAL_COMPONENTS', 'DOCUMENTATION', 'MARKINGS_LABELS'
        ]
        
        for inspection in inspections:
            if inspection.status in ['IN_PROGRESS', 'SUBMITTED', 'APPROVED']:
                # Create 5-9 answers per inspection
                for question in random.sample(questions, random.randint(5, 9)):
                    answer = InspectionAnswer.objects.create(
                        inspection=inspection,
                        question_key=question,
                        result=random.choice(['SAFE', 'SAFE', 'SAFE', 'NOT_SAFE', 'NA']),  # 60% safe
                        comment=fake.sentence() if random.random() > 0.5 else ''
                    )
                    answers.append(answer)
        
        return answers

    def create_certificates(self, inspections, created_by):
        """Create certificates"""
        certificates = []
        
        for inspection in inspections:
            if inspection.status in ['APPROVED']:
                certificate = Certificate.objects.create(
                    inspection=inspection,
                    qr_code=f"CERT-{fake.year()}-{fake.random_number(digits=8, fix_len=True)}",
                    issued_date=timezone.now(),
                    status='PUBLISHED' if random.random() > 0.3 else 'GENERATED',
                    approval_chain={'approved_by': 'manager1', 'approved_at': str(timezone.now())},
                    generated_by=created_by,
                    created_by=created_by
                )
                certificates.append(certificate)
        
        return certificates

    def create_approvals(self, inspections, managers, created_by):
        """Create approval records"""
        approvals = []
        
        for inspection in inspections:
            if inspection.status in ['SUBMITTED', 'APPROVED', 'REJECTED']:
                decision = 'APPROVED' if inspection.status == 'APPROVED' else ('REJECTED' if inspection.status == 'REJECTED' else 'PENDING')
                
                approval = Approval.objects.create(
                    entity_type='INSPECTION',
                    entity_id=inspection.id,
                    approver=random.choice(managers),
                    decision=decision,
                    comment=fake.sentence() if decision == 'REJECTED' else '',
                    decided_at=timezone.now() if decision != 'PENDING' else None
                )
                approvals.append(approval)
        
        return approvals

    def create_publications(self, job_orders, created_by):
        """Create publication records"""
        publications = []
        
        for job_order in job_orders:
            if job_order.status in ['COMPLETED', 'PUBLISHED']:
                publication = Publication.objects.create(
                    job_order=job_order,
                    status='PUBLISHED' if job_order.status == 'PUBLISHED' else 'DRAFT',
                    published_at=timezone.now() if job_order.status == 'PUBLISHED' else None,
                    published_by=created_by if job_order.status == 'PUBLISHED' else None,
                    note=fake.sentence(),
                    created_by=created_by
                )
                publications.append(publication)
        
        return publications
