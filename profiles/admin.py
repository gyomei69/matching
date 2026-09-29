from django.contrib import admin
from .models import (
    MentorProfile,
    MenteeProfile,
    InterestTag,
    VerificationDocument,
    CoordinatorProfile,
    SystemSettings,
)
from matching.models import Notification


class MentorVerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    fk_name = "mentor"
    extra = 0
    fields = ("kind", "file", "original_name", "uploaded_at")
    readonly_fields = ("uploaded_at",)
    exclude = ("mentee",)


class MenteeVerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    fk_name = "mentee"
    extra = 0
    fields = ("kind", "file", "original_name", "uploaded_at")
    readonly_fields = ("uploaded_at",)
    exclude = ("mentor",)


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "program", "year_level", "capacity", "approved")
    search_fields = ("user__username", "program")
    list_filter = ("program", "year_level", "approved")
    inlines = (MentorVerificationDocumentInline,)
    actions = ("approve_mentors",)

    def approve_mentors(self, request, queryset):
        from accounts.models import UserProfile, get_user_profile
        from api.views import invalidate_approval_cache_mentor, _clear_me_cache
        count = 0
        for mentor in queryset:
            mentor.approved = True
            mentor.save(update_fields=["approved"])
            up = getattr(mentor.user, "profile", None) or get_user_profile(mentor.user)
            if up:
                up.approval_status = UserProfile.STATUS_ACTIVE
                up.save(update_fields=["approval_status"])
            invalidate_approval_cache_mentor(mentor.id)
            _clear_me_cache(mentor.user_id)
            Notification.objects.create(
                user=mentor.user,
                message="Your mentor account has been approved.",
            )
            count += 1
        self.message_user(request, f"Approved {count} mentor(s).")

    approve_mentors.short_description = "Approve selected mentors"


@admin.register(MenteeProfile)
class MenteeProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "program", "year_level")
    search_fields = ("user__username", "program")
    list_filter = ("program", "year_level")
    inlines = (MenteeVerificationDocumentInline,)


@admin.register(InterestTag)
class InterestTagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(CoordinatorProfile)
class CoordinatorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_auto_approve_enabled", "is_auto_verify_enabled", "updated_at")
    list_filter = ("is_auto_approve_enabled", "is_auto_verify_enabled")
    search_fields = ("user__username", "user__email")


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "is_auto_approve_enabled", "is_auto_verify_enabled", "updated_at")
    list_filter = ("is_auto_approve_enabled", "is_auto_verify_enabled")


