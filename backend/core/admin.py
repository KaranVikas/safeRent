from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Building, Complaint, Confirmation, FlaggedComplaint


@admin.register(Building)
class BuildingAdmin(GISModelAdmin):
    list_display = ("address", "city", "postal_code_prefix", "complaint_count", "created_at")
    search_fields = ("address",)
    list_filter = ("city",)

    @admin.display(description="Complaints")
    def complaint_count(self, obj):
        return obj.complaints.count()


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("issue_type", "building", "is_hidden", "confirmation_count", "created_at")
    list_filter = ("issue_type", "is_hidden")
    search_fields = ("building__address", "description")
    readonly_fields = ("session_hash", "created_at")
    actions = ["hide_complaints", "unhide_complaints"]

    @admin.action(description="Hide selected complaints")
    def hide_complaints(self, request, queryset):
        queryset.update(is_hidden=True)

    @admin.action(description="Unhide selected complaints")
    def unhide_complaints(self, request, queryset):
        queryset.update(is_hidden=False)


@admin.register(Confirmation)
class ConfirmationAdmin(admin.ModelAdmin):
    list_display = ("complaint", "created_at")
    readonly_fields = ("session_hash",)


@admin.register(FlaggedComplaint)
class FlaggedComplaintAdmin(admin.ModelAdmin):
    """The moderation queue. Changing status resolves/restores the complaint."""
    list_display = ("complaint", "status", "reason", "created_at")
    list_filter = ("status",)
    readonly_fields = ("flagger_session_hash", "created_at")
    actions = ["resolve_remove", "reject_restore"]

    @admin.action(description="Resolve: keep complaint hidden (it was misleading)")
    def resolve_remove(self, request, queryset):
        queryset.update(status="resolved")

    @admin.action(description="Reject flag: restore the complaint")
    def reject_restore(self, request, queryset):
        for flag in queryset:
            flag.status = "rejected"
            flag.save()
            # Restore only if no other pending flags remain.
            if not flag.complaint.flags.filter(status="pending").exists():
                flag.complaint.is_hidden = False
                flag.complaint.save(update_fields=["is_hidden"])
