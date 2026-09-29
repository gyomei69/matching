from django.db import models
from django.contrib.auth.models import User

from profiles.models import MentorProfile, MenteeProfile


class Subject(models.Model):
    CATEGORY_MAJOR = "major"
    CATEGORY_GE = "ge"
    CATEGORY_NSTP = "nstp"
    CATEGORY_PE = "pe"
    CATEGORY_CHOICES = (
        (CATEGORY_MAJOR, "Major"),
        (CATEGORY_GE, "General Education (GE)"),
        (CATEGORY_NSTP, "NSTP"),
        (CATEGORY_PE, "Physical Education (PE)"),
    )

    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=30, blank=True, default="")
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default=CATEGORY_MAJOR,
    )
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self) -> str:
        return self.name

    @property
    def is_minor(self) -> bool:
        return self.category != self.CATEGORY_MAJOR


class Topic(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    )

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="topics")
    name = models.CharField(max_length=150)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
    )
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_topics",
    )
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_topics",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        unique_together = ("subject", "name")
        ordering = ["subject__name", "name"]

    def __str__(self) -> str:
        return f"{self.subject.name} - {self.name}"

    @property
    def is_active(self) -> bool:
        return self.status == self.STATUS_ACTIVE


class Competency(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="competencies")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("topic", "name")
        ordering = ["topic__name", "name"]

    def __str__(self) -> str:
        return f"{self.topic.name} - {self.name}"


class UserTopicPreference(models.Model):
    TARGET_MENTOR = "mentor"
    TARGET_MENTEE = "mentee"
    TARGET_CHOICES = (
        (TARGET_MENTOR, "Mentor"),
        (TARGET_MENTEE, "Mentee"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="topic_preferences")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="topic_preferences")
    topic = models.ForeignKey(Topic, on_delete=models.PROTECT, related_name="user_preferences")
    target = models.CharField(max_length=10, choices=TARGET_CHOICES)
    is_active_selection = models.BooleanField(default=True)
    selected_at = models.DateTimeField(auto_now_add=True)
    cleared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "target", "is_active_selection"], name="mt_utp_user_target_act"),
            models.Index(fields=["topic"], name="mt_utp_topic"),
        ]

    def __str__(self) -> str:
        return f"UserTopicPreference<{self.user_id}:{self.target}:{self.topic_id}>"


class MatchingDatasetRecord(models.Model):
    SOURCE_REAL = "real"
    SOURCE_SYNTHETIC = "synthetic"
    SOURCE_CHOICES = (
        (SOURCE_REAL, "Real"),
        (SOURCE_SYNTHETIC, "Synthetic"),
    )

    mentee = models.ForeignKey(
        MenteeProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dataset_records",
    )
    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dataset_records",
    )
    label = models.BooleanField(default=False)
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES, default=SOURCE_REAL)
    features = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["source", "-created_at"], name="mt_ds_source_created"),
        ]

    def __str__(self) -> str:
        return f"MatchingDatasetRecord<{self.id}:{self.source}>"


class MatchingDatasetTopic(models.Model):
    ROLE_MENTEE = "mentee"
    ROLE_MENTOR = "mentor"
    ROLE_CHOICES = (
        (ROLE_MENTEE, "Mentee"),
        (ROLE_MENTOR, "Mentor"),
    )

    dataset_record = models.ForeignKey(
        MatchingDatasetRecord,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dataset_links",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dataset_topic_links",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    topic_name_snapshot = models.CharField(max_length=150, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["dataset_record", "role"], name="mt_dst_record_role"),
            models.Index(fields=["topic"], name="mt_dst_topic"),
        ]

    def __str__(self) -> str:
        return f"MatchingDatasetTopic<{self.dataset_record_id}:{self.role}:{self.topic_id}>"


class ModelMetadata(models.Model):
    STATUS_STAGED = "staged"
    STATUS_ACTIVE = "active"
    STATUS_RETIRED = "retired"
    STATUS_CHOICES = (
        (STATUS_STAGED, "Staged"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_RETIRED, "Retired"),
    )

    version = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_STAGED)
    artifact_path = models.CharField(max_length=255, blank=True, default="")
    metrics = models.JSONField(default=dict, blank=True)
    feature_names = models.JSONField(default=list, blank=True)
    training_rows = models.PositiveIntegerField(default=0)
    topic_count_active_at_train = models.PositiveIntegerField(default=0)
    trained_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_model_metadata",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="mt_model_status_created"),
        ]

    def __str__(self) -> str:
        return f"ModelMetadata<{self.version}:{self.status}>"


class MenteeMentorRequest(models.Model):
    """Tracks when a mentee chooses a mentor; mentor can accept to make the pairing official."""
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    mentee = models.ForeignKey(MenteeProfile, on_delete=models.CASCADE)
    mentor = models.ForeignKey(MentorProfile, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("mentee", "mentor")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["mentor", "-created_at"], name="matching_mmr_mentor_created"),
            models.Index(fields=["mentor", "accepted"], name="matching_mmr_mentor_accepted"),
            models.Index(fields=["status", "-created_at"], name="matching_mmr_status_created"),
        ]

    def save(self, *args, **kwargs):
        if self.status == self.STATUS_APPROVED:
            self.accepted = True
            if not self.approved_at and self.accepted_at:
                self.approved_at = self.accepted_at
            elif not self.accepted_at and self.approved_at:
                self.accepted_at = self.approved_at
        elif self.accepted and self.status == self.STATUS_PENDING:
            self.status = self.STATUS_APPROVED
            if not self.approved_at and self.accepted_at:
                self.approved_at = self.accepted_at
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"MenteeRequest({self.mentee_id}->{self.mentor_id}:{self.status})"



class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    action_tab = models.CharField(max_length=50, blank=True, default="", help_text="Tab to open when notification is clicked (e.g. matching).")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"], name="matching_notif_user_read"),
        ]

    def __str__(self) -> str:
        return f"Notification<{self.user_id}>"


class Announcement(models.Model):
    """Mentor-posted announcement. If recipients exist, only they see it; else all accepted mentees see it."""
    mentor = models.ForeignKey(MentorProfile, on_delete=models.CASCADE, related_name="announcements")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Soft delete; when set, hidden from lists.")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["mentor", "-created_at"], name="matching_ann_mentor_created"),
        ]

    def __str__(self) -> str:
        return f"Announcement<{self.mentor_id} @ {self.created_at}>"


class AnnouncementRecipient(models.Model):
    """Optional: restrict an announcement to specific user(s). Empty = visible to all mentor's mentees."""
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name="recipients")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="announcement_recipient_entries")

    class Meta:
        unique_together = [("announcement", "user")]
        indexes = [
            models.Index(fields=["announcement"], name="matching_ann_recip_ann"),
            models.Index(fields=["user"], name="matching_ann_recip_user"),
        ]

    def __str__(self) -> str:
        return f"AnnouncementRecipient(ann={self.announcement_id} user={self.user_id})"


class Comment(models.Model):
    """Comment on an announcement."""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="comments"
    )

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["announcement"], name="matching_cmt_announcement"),
        ]

    def __str__(self) -> str:
        return f"Comment<{self.author_id} on ann={self.announcement_id}>"


class UserPost(models.Model):
    CATEGORY_CHOICES = (
        ("achievement", "Achievement"),
        ("project", "Project"),
        ("update", "Update"),
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to="posts/%Y/%m/", blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="update")
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    shared_from = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="shares",
        help_text="When set, this post is a share of another post shown on the sharer's profile.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["author", "-created_at"], name="userpost_author_created"),
        ]

    def __str__(self) -> str:
        return f"Post<{self.author_id} {self.category} @ {self.created_at}>"

    def root_post(self):
        """Resolve nested shares to the original post."""
        post = self
        seen = set()
        while post.shared_from_id and post.shared_from_id not in seen:
            seen.add(post.id)
            post = post.shared_from
        return post



class PostComment(models.Model):
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["post", "created_at"], name="postcmt_post_created"),
        ]

    def __str__(self) -> str:
        return f"PostComment<{self.author_id} on post={self.post_id}>"


class AuditLog(models.Model):
    """Simple audit trail: who did what to which model."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="audit_logs")
    action = models.CharField(max_length=32)  # e.g. create, update, delete, approve
    model_name = models.CharField(max_length=64)  # e.g. announcement, mentor_approval
    object_id = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["model_name", "object_id"], name="audit_model_object")]

    def __str__(self) -> str:
        return f"Audit<{self.action} {self.model_name}:{self.object_id} by {self.user_id}>"
