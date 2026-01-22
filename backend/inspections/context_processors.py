"""
Context processors to make company information available in templates
"""
from django.conf import settings


def company_info(request):
    """Add company information to template context"""
    return {
        'COMPANY_NAME': settings.COMPANY_NAME,
        'COMPANY_FULL_NAME': settings.COMPANY_FULL_NAME,
        'COMPANY_DIVISION': settings.COMPANY_DIVISION,
    }
