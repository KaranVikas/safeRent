"""
SafeRent core models.

Privacy-by-design decisions encoded here:
- session_hash columns store SHA-256(SECRET_KEY + session_key), never the raw
  Django session key. Even with full DB access, complaints can't be linked
  back to a browser session.
- No columns exist that could hold tenant PII (no name, email, phone).
- Buildings store only address + 3-char postal prefix (FSA), never a full
  postal code, and never a landlord/company name (anti-defamation rule).
"""
import uuid

from django.contrib.gis.db import models as gis_models
from django.db import models


class IssueType(models.TextChoices):
    MOLD = "mold", "Mold / dampness"
    PESTS = "pests", "Pests (mice, roaches, bedbugs)"
    HEAT = "heat", "No heat / inadequate heat"
    WATER = "water", "Water / plumbing"
    REPAIRS = "repairs", "Repairs not done"
    SAFETY = "safety", "Safety (locks, fire, structural)"
    OTHER = "other", "Other"


class FlagStatus(models.TextChoices):
    PENDING = "pending", "Pending review"
    RESOLVED = "resolved", "Resolved (complaint removed)"
    REJECTED = "rejected", "Rejected (complaint restored)"


class Building(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    address = models.TextField(help_text="Normalized street address, e.g. '123 King St E'")
    city = models.CharField(max_length=100, default="Hamilton")
    postal_code_prefix = models.CharField(
        max_length=3, blank=True,
        help_text="First 3 characters only (FSA), e.g. 'L8N' — never the full code",
    )
    location = gis_models.PointField(geography=True, srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # One row per normalized address per city — dedupe at the DB level,
            # not just in application code.
            models.UniqueConstraint(fields=["address", "city"], name="uniq_building_address_city"),
        ]
        indexes = [models.Index(fields=["city"])]

    def __str__(self):
        return f"{self.address}, {self.city}"

    @property
    def visible_complaints(self):
        return self.complaints.filter(is_hidden=False)


class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="complaints")
    issue_type = models.CharField(max_length=20, choices=IssueType.choices)
    description = models.TextField(max_length=500, blank=True)
    session_hash = models.CharField(
        max_length=64, db_index=True,
        help_text="SHA-256 of (SECRET_KEY + session key). Raw session key is never stored.",
    )
    confirmation_count = models.PositiveIntegerField(default=0)
    is_hidden = models.BooleanField(
        default=False,
        help_text="Hidden complaints don't appear publicly (flagged, awaiting moderation).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["building", "is_hidden"])]

    def __str__(self):
        return f"{self.get_issue_type_display()} @ {self.building.address}"


class Confirmation(models.Model):
    """A 'Same here' on a complaint. One per session per complaint, enforced by the DB."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="confirmations")
    session_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["complaint", "session_hash"], name="uniq_confirmation_per_session"
            ),
        ]

    def __str__(self):
        return f"Confirmation on {self.complaint_id}"


class FlaggedComplaint(models.Model):
    """A 'this is false/misleading' report. Flagging auto-hides the complaint until reviewed."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="flags")
    reason = models.TextField(max_length=500, blank=True)
    flagger_session_hash = models.CharField(max_length=64)
    status = models.CharField(max_length=10, choices=FlagStatus.choices, default=FlagStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # One flag per session per complaint — stops flag-spamming a complaint
            # into oblivion from a single browser.
            models.UniqueConstraint(
                fields=["complaint", "flagger_session_hash"], name="uniq_flag_per_session"
            ),
        ]

    def __str__(self):
        return f"Flag ({self.status}) on {self.complaint_id}"
