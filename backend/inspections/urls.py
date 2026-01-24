from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, ServiceVersionViewSet,
    UserViewSet, ClientViewSet, EquipmentViewSet, JobOrderViewSet,
    JobLineItemViewSet, InspectionViewSet, InspectionAnswerViewSet,
    PhotoRefViewSet, CertificateViewSet, FieldInspectionReportViewSet, StickerViewSet, ApprovalViewSet,
    PublicationViewSet, ToolViewSet, CalibrationViewSet, CompetenceAuthorizationViewSet,
    CompetenceEvidenceViewSet, PersonViewSet, PersonCredentialViewSet, ToolCategoryViewSet,
    ToolAssignmentViewSet, ToolUsageLogViewSet, ToolIncidentViewSet
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'service-versions', ServiceVersionViewSet, basename='serviceversion')
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'job-orders', JobOrderViewSet, basename='joborder')
router.register(r'line-items', JobLineItemViewSet, basename='lineitem')
router.register(r'inspections', InspectionViewSet, basename='inspection')
router.register(r'inspection-answers', InspectionAnswerViewSet, basename='inspectionanswer')
router.register(r'photos', PhotoRefViewSet, basename='photoref')
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'field-reports', FieldInspectionReportViewSet, basename='fieldinspectionreport')
router.register(r'stickers', StickerViewSet, basename='sticker')
router.register(r'approvals', ApprovalViewSet, basename='approval')
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'tool-categories', ToolCategoryViewSet, basename='toolcategory')
router.register(r'tools', ToolViewSet, basename='tool')
router.register(r'calibrations', CalibrationViewSet, basename='calibration')
router.register(r'tool-assignments', ToolAssignmentViewSet, basename='toolassignment')
router.register(r'tool-usage', ToolUsageLogViewSet, basename='toolusagelog')
router.register(r'tool-incidents', ToolIncidentViewSet, basename='toolincident')
router.register(r'competence-authorizations', CompetenceAuthorizationViewSet, basename='competenceauthorization')
router.register(r'competence-evidence', CompetenceEvidenceViewSet, basename='competenceevidence')
router.register(r'people', PersonViewSet, basename='person')
router.register(r'person-credentials', PersonCredentialViewSet, basename='personcredential')

urlpatterns = [
    path('', include(router.urls)),
]
