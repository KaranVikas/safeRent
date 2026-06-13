"""
API serializers.

Validation philosophy: the DB constraints are the last line of defense;
serializers are the first. Coordinates must fall inside greater Hamilton —
this is the backend check that backs up frontend geocoding.
"""
from django.contrib.gis.geos import Point
from rest_framework import serializers

from .models import Building, Complaint, IssueType

# Generous bounding box around greater Hamilton (Dundas to Stoney Creek).
HAMILTON_BBOX = {
    "min_lng": -80.25, "max_lng": -79.55,
    "min_lat": 43.05, "max_lat": 43.45,
}


class ComplaintCreateSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=300)
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    postal_code_prefix = serializers.CharField(max_length=3, required=False, allow_blank=True, default="")
    issue_type = serializers.ChoiceField(choices=IssueType.choices)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")

    def validate(self, data):
        if not (HAMILTON_BBOX["min_lat"] <= data["lat"] <= HAMILTON_BBOX["max_lat"]
                and HAMILTON_BBOX["min_lng"] <= data["lng"] <= HAMILTON_BBOX["max_lng"]):
            raise serializers.ValidationError(
                "SafeRent currently covers Hamilton, ON only. The address must be in the Hamilton area."
            )
        return data

    def validate_address(self, value):
        cleaned = " ".join(value.split())  # collapse whitespace -> consistent dedupe
        if len(cleaned) < 5:
            raise serializers.ValidationError("Please select a full street address.")
        return cleaned

    def validate_postal_code_prefix(self, value):
        return value.strip().upper()[:3]

    def create(self, validated_data):
        building, _ = Building.objects.get_or_create(
            address=validated_data["address"],
            city="Hamilton",
            defaults={
                "postal_code_prefix": validated_data["postal_code_prefix"],
                "location": Point(validated_data["lng"], validated_data["lat"], srid=4326),
            },
        )
        return Complaint.objects.create(
            building=building,
            issue_type=validated_data["issue_type"],
            description=validated_data["description"],
            session_hash=self.context["session_hash"],
        )


class ComplaintPublicSerializer(serializers.ModelSerializer):
    """What the public sees about a complaint. session_hash is NEVER exposed."""
    issue_label = serializers.CharField(source="get_issue_type_display", read_only=True)

    class Meta:
        model = Complaint
        fields = ["id", "issue_type", "issue_label", "description",
                  "confirmation_count", "created_at"]


class BuildingPinSerializer(serializers.ModelSerializer):
    """Lightweight payload for map pins."""
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    complaint_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Building
        fields = ["id", "address", "lat", "lng", "complaint_count"]

    def get_lat(self, obj):
        return obj.location.y

    def get_lng(self, obj):
        return obj.location.x


class BuildingDetailSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    complaints = serializers.SerializerMethodField()
    breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Building
        fields = ["id", "address", "city", "postal_code_prefix",
                  "lat", "lng", "breakdown", "complaints"]

    def get_lat(self, obj):
        return obj.location.y

    def get_lng(self, obj):
        return obj.location.x

    def get_complaints(self, obj):
        qs = obj.visible_complaints.order_by("-created_at")
        return ComplaintPublicSerializer(qs, many=True).data

    def get_breakdown(self, obj):
        counts = {}
        for c in obj.visible_complaints.values_list("issue_type", flat=True):
            counts[c] = counts.get(c, 0) + 1
        return counts
