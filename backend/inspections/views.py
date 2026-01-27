from datetime import datetime

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Q, Count, Prefetch

from .models import (
    Client, Equipment, JobOrder, JobLineItem, Inspection,
    InspectionAnswer, PhotoRef, Certificate, Sticker,
    FieldInspectionReport, Approval, Publication, Tool, Calibration, User,
    Service, ServiceVersion, CompetenceAuthorization, CompetenceEvidence,
    Person, PersonCredential, ToolCategory, ToolAssignment, ToolUsageLog,
    ToolIncident
)
from .serializers import (
    ClientSerializer, EquipmentSerializer, JobOrderSerializer,
    JobOrderListSerializer, JobLineItemSerializer, InspectionSerializer,
    InspectionAnswerSerializer, PhotoRefSerializer, CertificateSerializer,
    StickerSerializer, StickerResolveSerializer, FieldInspectionReportSerializer,
    ApprovalSerializer, PublicationSerializer, ToolSerializer,
    CalibrationSerializer, UserSerializer, AssignInspectorSerializer,
    InspectionSubmitSerializer, ServiceSerializer, ServiceVersionSerializer,
    CompetenceAuthorizationSerializer, CompetenceEvidenceSerializer,
    PersonSerializer, PersonCredentialSerializer, ToolCategorySerializer,
    ToolAssignmentSerializer, ToolUsageLogSerializer, ToolIncidentSerializer
)
from .permissions import (
    IsAdmin, IsAdminOrTeamLead, IsInspector, CanApprove,
    CanPublish, ClientReadOnly, IsOwnerOrAdmin, IsAdminOrTechnicalManager
)


def _parse_datetime_param(value):
    """Parse ISO datetime strings into aware datetimes for filtering."""
    if not value:
        return None
    dt = parse_datetime(value)
    if dt is None:
        # Attempt to parse date-only strings
        try:
            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone=timezone.get_current_timezone())
    return dt


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for governed services"""
    queryset = Service.objects.prefetch_related('versions').all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['code', 'name_en', 'name_ar', 'discipline']
    ordering_fields = ['code', 'name_en', 'created_at']
    ordering = ['code']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CompetenceAuthorizationViewSet(viewsets.ModelViewSet):
    """ViewSet for HR competence authorizations."""

    queryset = CompetenceAuthorization.objects.select_related('user', 'service', 'created_by', 'updated_by').prefetch_related('evidence_items')
    serializer_class = CompetenceAuthorizationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'service', 'status', 'level']
    search_fields = ['user__first_name', 'user__last_name', 'user__username', 'discipline', 'service__code']
    ordering_fields = ['valid_from', 'valid_until', 'updated_at']
    ordering = ['-valid_from']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CompetenceEvidenceViewSet(viewsets.ModelViewSet):
    """ViewSet for competence evidence records."""

    queryset = CompetenceEvidence.objects.select_related('authorization__user', 'authorization__service')
    serializer_class = CompetenceEvidenceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['authorization', 'evidence_type', 'issued_on']
    search_fields = ['issued_by', 'reference_code', 'authorization__user__username']
    ordering_fields = ['issued_on', 'created_at']
    ordering = ['-issued_on']


class PersonViewSet(viewsets.ModelViewSet):
    """ViewSet for people registry."""

    queryset = Person.objects.select_related('client', 'created_by', 'updated_by').prefetch_related('credentials')
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['person_type', 'client']
    search_fields = ['first_name', 'last_name', 'email', 'employer', 'client__name']
    ordering_fields = ['last_name', 'person_type', 'created_at']
    ordering = ['last_name', 'first_name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class PersonCredentialViewSet(viewsets.ModelViewSet):
    """ViewSet for person credentials."""

    queryset = PersonCredential.objects.select_related('person', 'person__client')
    serializer_class = PersonCredentialSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['person', 'status']
    search_fields = ['person__first_name', 'person__last_name', 'credential_name', 'reference_code']
    ordering_fields = ['issued_on', 'valid_until', 'created_at']
    ordering = ['-issued_on']


class ServiceVersionViewSet(viewsets.ModelViewSet):
    """ViewSet for service versions"""
    queryset = ServiceVersion.objects.select_related('service').all()
    serializer_class = ServiceVersionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'is_published']
    ordering_fields = ['version_number', 'effective_date']
    ordering = ['-version_number']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for users."""

    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'role']
    ordering = ['username']

    def get_queryset(self):
        queryset = User.objects.all()

        # Non-admin users only see active accounts.
        if not self.request.user.is_authenticated or self.request.user.role != 'ADMIN':
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_permissions(self):
        # Admin-only mutations; authenticated reads.
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for clients"""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class EquipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for equipment"""
    queryset = Equipment.objects.select_related('client').all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'type']
    search_fields = ['tag_code', 'serial_number', 'manufacturer', 'model']
    ordering_fields = ['tag_code', 'next_due', 'created_at']
    ordering = ['tag_code']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def due_soon(self, request):
        """Get equipment due for inspection soon"""
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        future_date = today + timezone.timedelta(days=days)
        
        equipment = self.queryset.filter(
            next_due__gte=today,
            next_due__lte=future_date
        )
        
        serializer = self.get_serializer(equipment, many=True)
        return Response(serializer.data)


class JobOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for job orders"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'finance_status']
    search_fields = ['po_reference', 'site_location']
    ordering_fields = ['created_at', 'scheduled_start', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = JobOrder.objects.select_related('client', 'created_by').prefetch_related(
            Prefetch('line_items', queryset=JobLineItem.objects.select_related('equipment'))
        )
        
        # Filter by role
        if self.request.user.role == 'CLIENT':
            # Clients only see their own job orders
            queryset = queryset.filter(client__email=self.request.user.email)
        elif self.request.user.role == 'INSPECTOR':
            # Inspectors see job orders assigned to them
            queryset = queryset.filter(
                Q(line_items__inspections__inspector=self.request.user) |
                Q(created_by=self.request.user)
            ).distinct()
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobOrderListSerializer
        return JobOrderSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrTeamLead])
    def assign(self, request, pk=None):
        """Assign inspector to job order line items"""
        job_order = self.get_object()
        serializer = AssignInspectorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        inspector_id = serializer.validated_data['inspector_id']
        line_item_ids = serializer.validated_data.get('line_item_ids', [])
        
        inspector = get_object_or_404(User, id=inspector_id, role='INSPECTOR')
        
        # Get line items to assign
        if line_item_ids:
            line_items = job_order.line_items.filter(id__in=line_item_ids)
        else:
            line_items = job_order.line_items.all()
        
        # Create inspections for each line item
        inspections_created = []
        for line_item in line_items:
            inspection, created = Inspection.objects.get_or_create(
                job_line_item=line_item,
                defaults={
                    'inspector': inspector,
                    'status': 'DRAFT',
                    'created_by': request.user
                }
            )
            if created:
                inspections_created.append(inspection.id)
                line_item.status = 'ASSIGNED'
                line_item.save()
        
        return Response({
            'message': f'Assigned {len(inspections_created)} inspections to {inspector.get_full_name()}',
            'inspection_ids': inspections_created
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get job order summary with statistics"""
        job_order = self.get_object()
        
        line_items = job_order.line_items.all()
        inspections = Inspection.objects.filter(job_line_item__job_order=job_order)
        
        summary = {
            'job_order': JobOrderSerializer(job_order).data,
            'statistics': {
                'total_line_items': line_items.count(),
                'total_inspections': inspections.count(),
                'inspections_by_status': {
                    'draft': inspections.filter(status='DRAFT').count(),
                    'in_progress': inspections.filter(status='IN_PROGRESS').count(),
                    'submitted': inspections.filter(status='SUBMITTED').count(),
                    'approved': inspections.filter(status='APPROVED').count(),
                    'rejected': inspections.filter(status='REJECTED').count(),
                }
            }
        }
        
        return Response(summary)


class JobLineItemViewSet(viewsets.ModelViewSet):
    """ViewSet for job line items"""
    queryset = JobLineItem.objects.select_related('job_order', 'equipment').all()
    serializer_class = JobLineItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['job_order', 'status']
    ordering = ['job_order', 'id']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class InspectionViewSet(viewsets.ModelViewSet):
    """ViewSet for inspections"""
    serializer_class = InspectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['inspector', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Inspection.objects.select_related(
            'job_line_item__job_order__client',
            'job_line_item__equipment',
            'inspector'
        ).prefetch_related('answers', 'photos')
        
        # Filter by role
        if self.request.user.role == 'INSPECTOR':
            queryset = queryset.filter(inspector=self.request.user)
        elif self.request.user.role == 'CLIENT':
            queryset = queryset.filter(
                job_line_item__job_order__client__email=self.request.user.email,
                status='APPROVED'
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            start_time=timezone.now()
        )
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsInspector])
    def submit(self, request, pk=None):
        """Submit inspection for review"""
        inspection = self.get_object()
        
        # Verify inspector owns this inspection
        if inspection.inspector != request.user and request.user.role != 'ADMIN':
            return Response(
                {'error': 'You can only submit your own inspections'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if inspection.status != 'IN_PROGRESS':
            return Response(
                {'error': 'Only in-progress inspections can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inspection.status = 'SUBMITTED'
        inspection.end_time = timezone.now()
        inspection.save()
        
        # Update line item status
        inspection.job_line_item.status = 'COMPLETED'
        inspection.job_line_item.save()
        
        serializer = self.get_serializer(inspection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[CanApprove])
    def approve(self, request, pk=None):
        """Approve inspection"""
        inspection = self.get_object()
        
        if inspection.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted inspections can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = request.data.get('comment', '')
        
        # Create approval record
        Approval.objects.create(
            entity_type='INSPECTION',
            entity_id=inspection.id,
            approver=request.user,
            decision='APPROVED',
            comment=comment,
            decided_at=timezone.now()
        )
        
        inspection.status = 'APPROVED'
        inspection.save()
        
        serializer = self.get_serializer(inspection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[CanApprove])
    def reject(self, request, pk=None):
        """Reject inspection"""
        inspection = self.get_object()
        
        if inspection.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted inspections can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = request.data.get('comment', '')
        if not comment:
            return Response(
                {'error': 'Comment is required for rejection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create approval record
        Approval.objects.create(
            entity_type='INSPECTION',
            entity_id=inspection.id,
            approver=request.user,
            decision='REJECTED',
            comment=comment,
            decided_at=timezone.now()
        )
        
        inspection.status = 'REJECTED'
        inspection.save()
        
        serializer = self.get_serializer(inspection)
        return Response(serializer.data)


class InspectionAnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for inspection answers"""
    queryset = InspectionAnswer.objects.all()
    serializer_class = InspectionAnswerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'result']


class PhotoRefViewSet(viewsets.ModelViewSet):
    """ViewSet for photo references"""
    queryset = PhotoRef.objects.all()
    serializer_class = PhotoRefSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'slot_name']


class CertificateViewSet(viewsets.ModelViewSet):
    """ViewSet for certificates"""
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated, ClientReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering = ['-issued_date']
    
    def get_queryset(self):
        queryset = Certificate.objects.select_related(
            'inspection__job_line_item__job_order__client',
            'generated_by'
        )
        
        # Filter by role
        if self.request.user.role == 'CLIENT':
            queryset = queryset.filter(
                status='PUBLISHED',
                inspection__job_line_item__job_order__client__email=self.request.user.email
            )
        
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request, token=None):
        """Public certificate view via share token"""
        token = request.query_params.get('token')
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        certificate = get_object_or_404(
            Certificate,
            share_link_token=token,
            status='PUBLISHED'
        )
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[CanApprove])
    def generate(self, request, pk=None):
        """Generate certificate PDF for approved inspection"""
        inspection_id = pk
        inspection = get_object_or_404(Inspection, id=inspection_id, status='APPROVED')
        
        # Check if certificate already exists
        if hasattr(inspection, 'certificate'):
            return Response(
                {'error': 'Certificate already exists for this inspection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import here to avoid circular imports
        from .tasks import generate_certificate_task
        
        # Trigger async task
        task = generate_certificate_task.delay(inspection.id, request.user.id)
        
        return Response({
            'message': 'Certificate generation started',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)


class FieldInspectionReportViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for field inspection reports"""
    serializer_class = FieldInspectionReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job_order']
    search_fields = ['job_order__po_reference', 'job_order__client__name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = FieldInspectionReport.objects.select_related(
            'job_order__client'
        )

        # Restrict client access to their own reports
        if self.request.user.role == 'CLIENT':
            queryset = queryset.filter(job_order__client__email=self.request.user.email)

        created_after = _parse_datetime_param(self.request.query_params.get('created_after'))
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)

        created_before = _parse_datetime_param(self.request.query_params.get('created_before'))
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)

        return queryset

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Public access to shared FIR via share token."""
        token = request.query_params.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        report = get_object_or_404(FieldInspectionReport, share_link_token=token)
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class StickerViewSet(viewsets.ModelViewSet):
    """ViewSet for stickers"""
    queryset = Sticker.objects.select_related('assigned_equipment', 'assigned_by').all()
    serializer_class = StickerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['sticker_code']
    ordering = ['sticker_code']
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrTeamLead])
    def generate(self, request):
        """Generate new sticker codes"""
        count = int(request.data.get('count', 1))
        if count < 1 or count > 1000:
            return Response(
                {'error': 'Count must be between 1 and 1000'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get last sticker number
        last_sticker = Sticker.objects.order_by('-sticker_code').first()
        if last_sticker:
            last_number = int(last_sticker.sticker_code.split('-')[1])
        else:
            last_number = 0
        
        stickers_created = []
        for i in range(count):
            number = last_number + i + 1
            sticker_code = f"TUVINSP-{number:06d}"
            qr_payload = f"https://inspection-saas.com/sticker/{sticker_code}"
            
            sticker = Sticker.objects.create(
                sticker_code=sticker_code,
                qr_payload=qr_payload,
                status='AVAILABLE',
                created_by=request.user
            )
            stickers_created.append(sticker.sticker_code)
        
        return Response({
            'message': f'Generated {count} stickers',
            'sticker_codes': stickers_created
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='resolve/(?P<code>[^/.]+)')
    def resolve(self, request, code=None):
        """Resolve sticker code to equipment and certificate info"""
        sticker = get_object_or_404(Sticker, sticker_code=code)
        
        data = {
            'sticker': StickerSerializer(sticker).data,
            'equipment': None,
            'latest_certificate': None,
            'inspection_history': []
        }
        
        if sticker.assigned_equipment:
            data['equipment'] = EquipmentSerializer(sticker.assigned_equipment).data
            
            # Get latest certificate
            latest_inspection = Inspection.objects.filter(
                job_line_item__equipment=sticker.assigned_equipment,
                status='APPROVED'
            ).order_by('-created_at').first()
            
            if latest_inspection and hasattr(latest_inspection, 'certificate'):
                data['latest_certificate'] = CertificateSerializer(
                    latest_inspection.certificate
                ).data
            
            # Get inspection history
            inspections = Inspection.objects.filter(
                job_line_item__equipment=sticker.assigned_equipment
            ).order_by('-created_at')[:5]
            data['inspection_history'] = InspectionSerializer(inspections, many=True).data
        
        return Response(data)


class ApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for approvals (read-only)"""
    queryset = Approval.objects.select_related('approver').all()
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['entity_type', 'decision', 'approver']
    ordering = ['-created_at']


class PublicationViewSet(viewsets.ModelViewSet):
    """ViewSet for publications"""
    queryset = Publication.objects.select_related('job_order', 'published_by').all()
    serializer_class = PublicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'job_order']
    ordering = ['-published_at']
    
    @action(detail=False, methods=['post'], permission_classes=[CanPublish])
    def publish_job_order(self, request):
        """Publish all approved certificates for a job order"""
        job_order_id = request.data.get('job_order_id')
        note = request.data.get('note', '')
        
        job_order = get_object_or_404(JobOrder, id=job_order_id)
        
        # Get all approved inspections for this job order
        inspections = Inspection.objects.filter(
            job_line_item__job_order=job_order,
            status='APPROVED'
        )
        
        if not inspections.exists():
            return Response(
                {'error': 'No approved inspections found for this job order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update all certificates to published
        certificates_published = 0
        for inspection in inspections:
            if hasattr(inspection, 'certificate'):
                certificate = inspection.certificate
                certificate.status = 'PUBLISHED'
                certificate.save()
                certificates_published += 1
        
        # Create publication record
        publication = Publication.objects.create(
            job_order=job_order,
            published_by=request.user,
            published_at=timezone.now(),
            status='PUBLISHED',
            note=note
        )
        
        # Update job order status
        job_order.status = 'PUBLISHED'
        job_order.save()
        
        return Response({
            'message': f'Published {certificates_published} certificates',
            'publication': PublicationSerializer(publication).data
        }, status=status.HTTP_200_OK)


class ToolViewSet(viewsets.ModelViewSet):
    """ViewSet for tools"""
    queryset = Tool.objects.select_related('assigned_to', 'category').all()
    serializer_class = ToolSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assigned_to', 'category', 'status', 'assignment_mode']
    search_fields = ['name', 'serial_number', 'location']
    ordering_fields = ['name', 'calibration_due', 'created_at']
    ordering = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CalibrationViewSet(viewsets.ModelViewSet):
    """ViewSet for calibrations"""
    queryset = Calibration.objects.select_related('tool').all()
    serializer_class = CalibrationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tool']
    ordering = ['-calibration_date']


class ToolCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for tool categories"""

    queryset = ToolCategory.objects.all()
    serializer_class = ToolCategorySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ToolAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for tool assignments"""

    queryset = ToolAssignment.objects.select_related(
        'tool', 'assigned_user', 'job_order', 'equipment', 'client'
    ).all()
    serializer_class = ToolAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tool', 'assignment_type', 'status', 'assigned_user', 'job_order']
    search_fields = ['tool__name', 'tool__serial_number', 'notes']
    ordering_fields = ['assigned_on', 'expected_return']
    ordering = ['-assigned_on']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ToolUsageLogViewSet(viewsets.ModelViewSet):
    """ViewSet for tool usage logs"""

    queryset = ToolUsageLog.objects.select_related('tool', 'assignment', 'performed_by').all()
    serializer_class = ToolUsageLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tool', 'event_type']
    search_fields = ['tool__name', 'tool__serial_number', 'notes']
    ordering_fields = ['occurred_at']
    ordering = ['-occurred_at']


class ToolIncidentViewSet(viewsets.ModelViewSet):
    """ViewSet for tool incidents"""

    queryset = ToolIncident.objects.select_related('tool').all()
    serializer_class = ToolIncidentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTechnicalManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tool', 'incident_type', 'severity']
    search_fields = ['tool__name', 'tool__serial_number', 'description']
    ordering_fields = ['occurred_on', 'severity']
    ordering = ['-occurred_on']
