from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User

MENTOR_MENTEE_CAPACITY = 5


STUDENT_MENTOR_DOCUMENT_KINDS = (
    ("letter_of_intent", "Letter of intent"),
    ("study_load", "Study load"),
    ("grade", "Grade"),
)
VERIFICATION_DOCUMENT_KIND_APPLICATION = "application"
VERIFICATION_DOCUMENT_KIND_CHOICES = STUDENT_MENTOR_DOCUMENT_KINDS + (
    (VERIFICATION_DOCUMENT_KIND_APPLICATION, "Application form"),
)
STUDENT_MENTOR_DOCUMENT_KIND_VALUES = tuple(
    kind for kind, _label in STUDENT_MENTOR_DOCUMENT_KINDS
)
VERIFICATION_DOCUMENT_KIND_LABELS = dict(VERIFICATION_DOCUMENT_KIND_CHOICES)


def verification_document_upload_path(instance, filename):
    role = "mentor" if getattr(instance._meta, "model_name", "") == "mentorprofile" else "mentee"
    user_id = getattr(instance, "user_id", "unknown")
    return f"verification_documents/{role}/user_{user_id}/{filename}"


def verification_document_item_upload_path(instance, filename):
    if getattr(instance, "mentor_id", None):
        role = "mentor"
        user_id = getattr(instance.mentor, "user_id", None) or "unknown"
    elif getattr(instance, "mentee_id", None):
        role = "mentee"
        user_id = getattr(instance.mentee, "user_id", None) or "unknown"
    else:
        role = "unknown"
        user_id = "unknown"
    kind = getattr(instance, "kind", None) or VERIFICATION_DOCUMENT_KIND_APPLICATION
    return f"verification_documents/{role}/user_{user_id}/{kind}/{filename}"


def rewind_uploaded_file(uploaded):
    seek = getattr(uploaded, "seek", None)
    if not callable(seek):
        return
    try:
        seek(0)
    except Exception:
        pass


def public_file_url(file_obj, request=None):
    if not file_obj:
        return ""
    try:
        url = file_obj.url or ""
    except Exception:
        return ""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    normalized = url if url.startswith("/") else f"/{url}"
    if request is None:
        return normalized
    return request.build_absolute_uri(normalized)


def serialize_verification_documents(profile, request=None):
    related = getattr(profile, "verification_documents", None)
    docs = []
    if related is not None:
        try:
            docs = list(related.all())
        except Exception:
            docs = []

    items = []
    grouped = {kind: [] for kind, _label in VERIFICATION_DOCUMENT_KIND_CHOICES}
    for doc in docs:
        name = (doc.original_name or "").strip()
        if not name and getattr(doc, "file", None):
            name = doc.file.name.rsplit("/", 1)[-1]
        item = {
            "id": doc.id,
            "kind": doc.kind,
            "label": VERIFICATION_DOCUMENT_KIND_LABELS.get(doc.kind, "Document"),
            "url": public_file_url(getattr(doc, "file", None), request),
            "name": name,
        }
        items.append(item)
        grouped.setdefault(doc.kind, []).append(item)

    if not items:
        file_obj = getattr(profile, "verification_document", None)
        if file_obj:
            name = file_obj.name.rsplit("/", 1)[-1] if file_obj.name else "Verification document"
            item = {
                "id": None,
                "kind": VERIFICATION_DOCUMENT_KIND_APPLICATION,
                "label": VERIFICATION_DOCUMENT_KIND_LABELS[VERIFICATION_DOCUMENT_KIND_APPLICATION],
                "url": public_file_url(file_obj, request),
                "name": name,
            }
            items = [item]
            grouped[VERIFICATION_DOCUMENT_KIND_APPLICATION] = [item]

    first = items[0] if items else None
    return {
        "verification_documents": items,
        "verification_documents_by_kind": grouped,
        "verification_document_url": first["url"] if first else "",
        "verification_document_name": first["name"] if first else "",
    }


def save_verification_documents(*, mentor=None, mentee=None, files_by_kind=None):
    created = []
    for kind, files in (files_by_kind or {}).items():
        for uploaded in files or []:
            if not uploaded:
                continue
            rewind_uploaded_file(uploaded)
            doc = VerificationDocument(
                mentor=mentor,
                mentee=mentee,
                kind=kind,
                original_name=(getattr(uploaded, "name", "") or "")[:255],
            )
            doc.file.save(uploaded.name, uploaded, save=True)
            created.append(doc)

    profile = mentor or mentee
    if profile is not None:
        first = profile.verification_documents.order_by("id").first()
        if first and first.file:
            profile.verification_document.name = first.file.name
            profile.save(update_fields=["verification_document"])
    return created


class InterestTag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class MentorProfile(models.Model):
    GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    program = models.CharField(max_length=100)
    year_level = models.PositiveSmallIntegerField()
    student_id_no = models.CharField(max_length=20, blank=True, default="")
    campus = models.CharField(max_length=100, blank=True, default="Main")
    contact_no = models.CharField(max_length=11, blank=True, default="")
    admission_type = models.CharField(max_length=100, blank=True, default="")
    is_profile_complete = models.BooleanField(default=False)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    avatar_url = models.URLField(blank=True, default="")
    cover_url = models.URLField(blank=True, default="")
    bio = models.TextField(max_length=200, blank=True, default="")
    skills = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    interests = models.TextField(blank=True)
    interest_tags = models.ManyToManyField(InterestTag, blank=True, related_name="mentor_profiles")
    capacity = models.PositiveSmallIntegerField(default=MENTOR_MENTEE_CAPACITY)
    role = models.CharField(max_length=50, blank=True)
    subjects = models.JSONField(default=list, blank=True)
    topics = models.JSONField(default=list, blank=True)
    competencies = models.ManyToManyField(
        "matching.Competency",
        blank=True,
        related_name="mentor_profiles",
    )
    years_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    teaching_experience_years = models.PositiveSmallIntegerField(null=True, blank=True)
    expertise_level = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default="")
    verification_document = models.FileField(
        upload_to=verification_document_upload_path,
        blank=True,
    )
    approved = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["gender", "approved"], name="prof_mentor_gender_appr"),
            models.Index(fields=["approved"], name="prof_mentor_approved"),
        ]

    def save(self, *args, **kwargs):
        self.capacity = MENTOR_MENTEE_CAPACITY
        super().save(*args, **kwargs)

    def __str__(self):
        return f"MentorProfile<{self.user.username}>"


class MenteeProfile(models.Model):
    PREFERRED_GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
        ("no_preference", "No Preference"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentee_profile')
    program = models.CharField(max_length=100)
    year_level = models.PositiveSmallIntegerField()
    gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    avatar_url = models.URLField(blank=True, default="")
    cover_url = models.URLField(blank=True, default="")
    bio = models.TextField(max_length=200, blank=True, default="")
    skills = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    interests = models.TextField(blank=True)
    interest_tags = models.ManyToManyField(InterestTag, blank=True, related_name="mentee_profiles")
    campus = models.CharField(max_length=100, blank=True)
    student_id_no = models.CharField(max_length=20, blank=True)
    is_profile_complete = models.BooleanField(default=False)
    contact_no = models.CharField(max_length=11, blank=True)
    admission_type = models.CharField(max_length=100, blank=True)
    sex = models.CharField(max_length=10, blank=True)
    subjects = models.JSONField(default=list, blank=True)
    topics = models.JSONField(default=list, blank=True)
    competencies = models.ManyToManyField(
        "matching.Competency",
        blank=True,
        related_name="mentee_profiles",
    )
    preferred_learning_style = models.CharField(max_length=100, blank=True, default="")
    difficulty_level = models.PositiveSmallIntegerField(null=True, blank=True)
    preferred_gender = models.CharField(
        max_length=20,
        choices=PREFERRED_GENDER_CHOICES,
        default="no_preference",
    )
    verification_document = models.FileField(
        upload_to=verification_document_upload_path,
        blank=True,
    )
    approved = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["sex", "approved"], name="prof_mentee_sex_appr"),
            models.Index(fields=["approved"], name="prof_mentee_approved"),
        ]

    def __str__(self):
        return f"MenteeProfile<{self.user.username}>"


class MentorCompetency(models.Model):
    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="competency_levels",
    )
    competency = models.ForeignKey(
        "matching.Competency",
        on_delete=models.CASCADE,
        related_name="mentor_competency_levels",
    )
    proficiency_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        unique_together = ("mentor", "competency")
        indexes = [
            models.Index(fields=["mentor", "competency"], name="prof_mcomp_mentor_comp"),
        ]

    def __str__(self):
        return (
            f"MentorCompetency<mentor={self.mentor_id}, "
            f"competency={self.competency_id}, level={self.proficiency_level}>"
        )


class MenteeCompetencyNeed(models.Model):
    mentee = models.ForeignKey(
        MenteeProfile,
        on_delete=models.CASCADE,
        related_name="competency_needs",
    )
    competency = models.ForeignKey(
        "matching.Competency",
        on_delete=models.CASCADE,
        related_name="mentee_competency_needs",
    )
    need_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        unique_together = ("mentee", "competency")
        indexes = [
            models.Index(fields=["mentee", "competency"], name="prof_mcneed_mentee_comp"),
        ]

    def __str__(self):
        return (
            f"MenteeCompetencyNeed<mentee={self.mentee_id}, "
            f"competency={self.competency_id}, level={self.need_level}>"
        )


class VerificationDocument(models.Model):
    KIND_LETTER_OF_INTENT = "letter_of_intent"
    KIND_STUDY_LOAD = "study_load"
    KIND_GRADE = "grade"
    KIND_APPLICATION = VERIFICATION_DOCUMENT_KIND_APPLICATION
    KIND_CHOICES = VERIFICATION_DOCUMENT_KIND_CHOICES

    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="verification_documents",
        null=True,
        blank=True,
    )
    mentee = models.ForeignKey(
        MenteeProfile,
        on_delete=models.CASCADE,
        related_name="verification_documents",
        null=True,
        blank=True,
    )
    kind = models.CharField(max_length=32, choices=KIND_CHOICES)
    file = models.FileField(upload_to=verification_document_item_upload_path)
    original_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["kind", "id"]
        indexes = [
            models.Index(fields=["mentor", "kind"], name="prof_vdoc_mentor_kind"),
            models.Index(fields=["mentee", "kind"], name="prof_vdoc_mentee_kind"),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(mentor__isnull=False, mentee__isnull=True)
                    | models.Q(mentor__isnull=True, mentee__isnull=False)
                ),
                name="verification_doc_one_profile",
            ),
        ]

    def __str__(self):
        owner = self.mentor_id or self.mentee_id
        return f"VerificationDocument<{self.kind}:{owner}>"


class CoordinatorProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="coordinator_profile",
    )
    is_auto_approve_enabled = models.BooleanField(
        default=False,
        help_text="If enabled, newly created mentorship pairings are automatically approved without manual review.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Coordinator Profile"
        verbose_name_plural = "Coordinator Profiles"

    def __str__(self):
        return f"CoordinatorProfile<{self.user_id}: auto_approve={self.is_auto_approve_enabled}>"


class SystemSettings(models.Model):
    is_auto_approve_enabled = models.BooleanField(
        default=False,
        help_text="Global system setting for auto-approving new mentorship match requests.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return f"SystemSettings(auto_approve={self.is_auto_approve_enabled})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

