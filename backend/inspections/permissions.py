from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission for admin users only"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsAdminOrTeamLead(permissions.BasePermission):
    """Permission for admin or team lead users"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'TEAM_LEAD']
        )


class IsAdminOrTechnicalManager(permissions.BasePermission):
    """Permission for admin or technical manager users"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'TECHNICAL_MANAGER']
        )


class IsInspector(permissions.BasePermission):
    """Permission for inspector users"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'INSPECTOR', 'TEAM_LEAD']
        )


class IsClient(permissions.BasePermission):
    """Permission for client users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'CLIENT'


class IsInspectorOrReadOnly(permissions.BasePermission):
    """Allow inspectors to edit, others to read only"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'INSPECTOR', 'TEAM_LEAD']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owner of object or admin to access"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        
        # Check if object has an inspector field
        if hasattr(obj, 'inspector'):
            return obj.inspector == request.user
        
        # Check if object has a created_by field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class CanApprove(permissions.BasePermission):
    """Permission for users who can approve inspections"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'TECHNICAL_MANAGER', 'TEAM_LEAD']
        )


class CanPublish(permissions.BasePermission):
    """Permission for users who can publish certificates"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'TEAM_LEAD']
        )


class ClientReadOnly(permissions.BasePermission):
    """Clients can only read published content"""
    def has_permission(self, request, view):
        if request.user.role == 'CLIENT':
            return request.method in permissions.SAFE_METHODS
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'CLIENT':
            # Clients can only view published certificates
            if hasattr(obj, 'status'):
                return obj.status == 'PUBLISHED'
            return False
        return True
