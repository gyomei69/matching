from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserProfile, get_user_profile, get_user_display_name
from ..permissions import IsCoordinator
from ..serializers import UserApprovalSerializer, PendingUserSerializer, PendingMentorSerializer
from ..views.helpers import audit_log, invalidate_approval_cache_mentor, invalidate_approval_cache_mentee
from .account_controller import _clear_me_cache

User = get_user_model()


def _is_coordinator_or_staff(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = get_user_profile(user, create_default=False)
    return bool(profile and profile.role == UserProfile.ROLE_COORDINATOR)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCoordinator])
def coordinator_approvals(request):
    role_filter = (request.GET.get("role") or "").strip().upper()
    queryset = (
        UserProfile.objects.filter(
            approval_status__in=[UserProfile.STATUS_PENDING, UserProfile.STATUS_PENDING_APPROVAL]
        )
        .select_related("user")
        .prefetch_related("user__documents")
        .order_by("-id")
    )
    if role_filter == "MENTOR":
        queryset = queryset.filter(
            role__in=[UserProfile.ROLE_STUDENT_MENTOR, UserProfile.ROLE_INSTRUCTOR_MENTOR]
        )
    elif role_filter == "MENTEE":
        queryset = queryset.filter(role=UserProfile.ROLE_MENTEE)

    serializer = UserApprovalSerializer(queryset, many=True, context={"request": request})
    all_users = serializer.data
    mentors = [u for u in all_users if u.get("role_type") == "mentor"]
    mentees = [u for u in all_users if u.get("role_type") == "mentee"]

    return JsonResponse({
        "count": len(all_users),
        "results": all_users,
        "users": all_users,
        "pending_mentors": mentors,
        "pending_mentees": mentees,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCoordinator])
def pending_mentors(request):
    pending_profiles = (
        UserProfile.objects.filter(
            approval_status__in=[UserProfile.STATUS_PENDING, UserProfile.STATUS_PENDING_APPROVAL],
            role__in=[UserProfile.ROLE_STUDENT_MENTOR, UserProfile.ROLE_INSTRUCTOR_MENTOR],
        )
        .select_related("user")
        .prefetch_related("user__documents")
        .order_by("-id")
    )
    serializer = UserApprovalSerializer(pending_profiles, many=True, context={"request": request})
    return JsonResponse({"count": len(serializer.data), "results": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCoordinator])
def pending_users(request):
    pending_profiles = (
        UserProfile.objects.filter(
            approval_status__in=[UserProfile.STATUS_PENDING, UserProfile.STATUS_PENDING_APPROVAL]
        )
        .select_related("user")
        .prefetch_related("user__documents")
        .order_by("-id")
    )
    serializer = UserApprovalSerializer(pending_profiles, many=True, context={"request": request})
    users_data = serializer.data
    return JsonResponse({"count": len(users_data), "users": users_data, "results": users_data})


@api_view(["POST", "PATCH"])
@permission_classes([IsAuthenticated])
def approve_mentor(request, user_id):
    if not _is_coordinator_or_staff(request.user):
        return JsonResponse({"error": "Coordinator access required."}, status=403)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return JsonResponse({"error": "User not found."}, status=404)

    profile = get_user_profile(user)
    profile.approval_status = UserProfile.STATUS_ACTIVE
    profile.save(update_fields=["approval_status"])

    # Synchronize mentor_profile.approved if exists
    if hasattr(user, "mentor_profile"):
        m = user.mentor_profile
        m.approved = True
        m.save(update_fields=["approved"])
        invalidate_approval_cache_mentor(m.id)

    # Synchronize mentee_profile.approved if exists
    if hasattr(user, "mentee_profile"):
        e = user.mentee_profile
        e.approved = True
        e.save(update_fields=["approved"])
        invalidate_approval_cache_mentee(e.id)

    _clear_me_cache(user.id)
    audit_log(request.user, "approve", "coordinator_approval", user.id)
    return JsonResponse({
        "status": "ok",
        "message": f"User {user.email} has been approved.",
        "user_id": user.id,
        "approval_status": profile.approval_status,
    })


@api_view(["POST", "PATCH"])
@permission_classes([IsAuthenticated])
def reject_mentor(request, user_id):
    if not _is_coordinator_or_staff(request.user):
        return JsonResponse({"error": "Coordinator access required."}, status=403)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return JsonResponse({"error": "User not found."}, status=404)

    profile = get_user_profile(user)
    profile.approval_status = UserProfile.STATUS_REJECTED
    profile.save(update_fields=["approval_status"])

    if hasattr(user, "mentor_profile"):
        m = user.mentor_profile
        m.approved = False
        m.save(update_fields=["approved"])
        invalidate_approval_cache_mentor(m.id)

    if hasattr(user, "mentee_profile"):
        e = user.mentee_profile
        e.approved = False
        e.save(update_fields=["approved"])
        invalidate_approval_cache_mentee(e.id)

    _clear_me_cache(user.id)
    audit_log(request.user, "reject", "coordinator_approval", user.id)
    return JsonResponse({
        "status": "ok",
        "message": f"User {user.email} has been rejected.",
        "user_id": user.id,
        "approval_status": profile.approval_status,
    })


approve_user = approve_mentor
reject_user = reject_mentor


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsCoordinator])
def coordinator_auto_approve(request):
    """
    GET: Retrieve the current auto-approve setting.
    PATCH: Update the is_auto_approve_enabled setting.
    """
    from profiles.models import CoordinatorProfile, SystemSettings

    coord_profile, _ = CoordinatorProfile.objects.get_or_create(user=request.user)
    sys_settings = SystemSettings.get_settings()

    if request.method == "GET":
        is_enabled = bool(coord_profile.is_auto_approve_enabled or sys_settings.is_auto_approve_enabled)
        return JsonResponse({
            "is_auto_approve_enabled": is_enabled,
            "status": "ok",
        })

    # PATCH
    data = request.data if hasattr(request, "data") else {}
    if not isinstance(data, dict):
        try:
            import json
            data = json.loads(request.body or "{}")
        except Exception:
            data = {}

    if "is_auto_approve_enabled" not in data:
        return JsonResponse(
            {"error": "Field 'is_auto_approve_enabled' is required."},
            status=400,
        )

    new_val = bool(data["is_auto_approve_enabled"])
    coord_profile.is_auto_approve_enabled = new_val
    coord_profile.save(update_fields=["is_auto_approve_enabled", "updated_at"])

    sys_settings.is_auto_approve_enabled = new_val
    sys_settings.save(update_fields=["is_auto_approve_enabled", "updated_at"])

    audit_log(
        request.user,
        "update_setting",
        "coordinator_auto_approve",
        coord_profile.id,
    )

    action_text = "enabled" if new_val else "disabled"
    return JsonResponse({
        "status": "ok",
        "is_auto_approve_enabled": new_val,
        "message": f"Auto-approval for new matches has been {action_text}.",
    })


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsCoordinator])
def coordinator_auto_verify(request):
    """
    GET: Retrieve the current auto-verify setting for new user registrations.
    PATCH: Update the is_auto_verify_enabled setting.
    """
    from profiles.models import CoordinatorProfile, SystemSettings

    coord_profile, _ = CoordinatorProfile.objects.get_or_create(user=request.user)
    sys_settings = SystemSettings.get_settings()

    if request.method == "GET":
        is_enabled = bool(coord_profile.is_auto_verify_enabled or sys_settings.is_auto_verify_enabled)
        return JsonResponse({
            "is_auto_verify_enabled": is_enabled,
            "status": "ok",
        })

    # PATCH
    data = request.data if hasattr(request, "data") else {}
    if not isinstance(data, dict):
        try:
            import json
            data = json.loads(request.body or "{}")
        except Exception:
            data = {}

    if "is_auto_verify_enabled" not in data:
        return JsonResponse(
            {"error": "Field 'is_auto_verify_enabled' is required."},
            status=400,
        )

    new_val = bool(data["is_auto_verify_enabled"])
    coord_profile.is_auto_verify_enabled = new_val
    coord_profile.save(update_fields=["is_auto_verify_enabled", "updated_at"])

    sys_settings.is_auto_verify_enabled = new_val
    sys_settings.save(update_fields=["is_auto_verify_enabled", "updated_at"])

    audit_log(
        request.user,
        "update_setting",
        "coordinator_auto_verify",
        coord_profile.id,
    )

    action_text = "enabled" if new_val else "disabled"
    return JsonResponse({
        "status": "ok",
        "is_auto_verify_enabled": new_val,
        "message": f"Auto-verification for new users has been {action_text}.",
    })



