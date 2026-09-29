from django.contrib import admin

from .models import (
    Subject,
    Topic,
    Competency,
    Notification,
    MenteeMentorRequest,
    UserPost,
    PostComment,
    UserTopicPreference,
    MatchingDatasetRecord,
    MatchingDatasetTopic,
    ModelMetadata,
)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "status", "updated_at")
    list_filter = ("subject", "status")
    search_fields = ("name", "subject__name")
    readonly_fields = ("created_at", "updated_at")

    def has_delete_permission(self, request, obj=None):
        _ = (request, obj)
        return False


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ("name", "topic")
    list_filter = ("topic__subject",)
    search_fields = ("name", "topic__name", "topic__subject__name")

    def has_delete_permission(self, request, obj=None):
        _ = (request, obj)
        return False


@admin.register(MenteeMentorRequest)
class MenteeMentorRequestAdmin(admin.ModelAdmin):
    list_display = ("mentee", "mentor", "status", "accepted", "created_at", "approved_at")
    list_filter = ("status", "accepted", "created_at")
    search_fields = ("mentee__user__username", "mentor__user__username")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "message", "is_read", "created_at")
    list_filter = ("is_read",)


@admin.register(UserPost)
class UserPostAdmin(admin.ModelAdmin):
    list_display = ("author", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("author__username", "text")


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("author", "post", "created_at")
    list_filter = ("created_at",)
    search_fields = ("author__username", "content")


@admin.register(UserTopicPreference)
class UserTopicPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "target", "subject", "topic", "is_active_selection", "selected_at")
    list_filter = ("target", "is_active_selection", "subject")
    search_fields = ("user__username", "topic__name", "subject__name")


@admin.register(MatchingDatasetRecord)
class MatchingDatasetRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "source", "label", "created_at")
    list_filter = ("source", "label")
    search_fields = ("id", "mentor__user__username", "mentee__user__username")


@admin.register(MatchingDatasetTopic)
class MatchingDatasetTopicAdmin(admin.ModelAdmin):
    list_display = ("dataset_record", "role", "topic", "topic_name_snapshot", "created_at")
    list_filter = ("role",)
    search_fields = ("topic__name", "topic_name_snapshot")


@admin.register(ModelMetadata)
class ModelMetadataAdmin(admin.ModelAdmin):
    list_display = ("version", "status", "training_rows", "topic_count_active_at_train", "created_at")
    list_filter = ("status",)
    search_fields = ("version", "artifact_path")
