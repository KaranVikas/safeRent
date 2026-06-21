"""
API views.

Privacy & abuse posture:
- Rate limits use DRF's cache-based throttling (keys on IP in memory/cache,
  nothing persisted to DB or logs -> consistent with the no-IP-logging policy).
- session_hash from core.sessions ties writes to an anonymous browser session.
"""
from django.contrib.gis.geos import Polygon
from django.db import IntegrityError
from django.db.models import Count, F, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Building, Complaint, Confirmation, FlaggedComplaint
from .serializers import (BuildingDetailSerializer, BuildingPinSerializer,
                          ComplaintCreateSerializer, ComplaintPublicSerializer)
from .sessions import get_session_hash


@api_view(["GET"])
@throttle_classes([])
def health(request):
    from django.db import connection
    db_ok, postgis_version = False, None
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT PostGIS_Version();")
            postgis_version = cur.fetchone()[0]
            db_ok = True
    except Exception:
        pass
    return Response({"status": "ok", "db": db_ok, "postgis": postgis_version})


class ComplaintThrottle(ScopedRateThrottle):
    scope = "complaints"


@api_view(["POST"])
@throttle_classes([ComplaintThrottle])
def create_complaint(request):
    """POST /api/complaints/  {address, lat, lng, postal_code_prefix?, issue_type, description?}"""
    session_hash = get_session_hash(request)
    serializer = ComplaintCreateSerializer(
        data=request.data, context={"session_hash": session_hash}
    )
    serializer.is_valid(raise_exception=True)
    complaint = serializer.save()
    return Response(
        {
            "id": str(complaint.id),
            "building_id": str(complaint.building_id),
            "message": "Your anonymous complaint has been recorded.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def list_buildings(request):
    """GET /api/buildings/?bbox=minLng,minLat,maxLng,maxLat — pins for the visible map."""
    qs = Building.objects.annotate(
        complaint_count=Count("complaints", filter=Q(complaints__is_hidden=False))
    ).filter(complaint_count__gt=0)

    bbox = request.query_params.get("bbox")
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = (float(v) for v in bbox.split(","))
        except ValueError:
            return Response({"detail": "bbox must be minLng,minLat,maxLng,maxLat"},
                            status=status.HTTP_400_BAD_REQUEST)
        area = Polygon.from_bbox((min_lng, min_lat, max_lng, max_lat))
        area.srid = 4326
        qs = qs.filter(location__intersects=area)

    qs = qs.order_by("-complaint_count")[:500]  # hard cap: pin payloads stay small
    return Response(BuildingPinSerializer(qs, many=True).data)


@api_view(["GET"])
def building_detail(request, pk):
    """GET /api/buildings/<uuid>/ — full breakdown for the detail panel."""
    building = get_object_or_404(Building, pk=pk)
    return Response(BuildingDetailSerializer(building).data)


@api_view(["POST"])
def confirm_complaint(request, pk):
    """POST /api/complaints/<uuid>/confirm/ — 'Same here'. Idempotent per session."""
    complaint = get_object_or_404(Complaint, pk=pk, is_hidden=False)
    session_hash = get_session_hash(request)
    try:
        Confirmation.objects.create(complaint=complaint, session_hash=session_hash)
    except IntegrityError:
        return Response(
            {"detail": "You've already confirmed this complaint.",
             "confirmation_count": complaint.confirmation_count},
            status=status.HTTP_409_CONFLICT,
        )
    Complaint.objects.filter(pk=pk).update(confirmation_count=F("confirmation_count") + 1)
    complaint.refresh_from_db(fields=["confirmation_count"])
    return Response({"confirmation_count": complaint.confirmation_count},
                    status=status.HTTP_201_CREATED)


@api_view(["POST"])
def flag_complaint(request, pk):
    """POST /api/complaints/<uuid>/flag/ {reason?} — hides complaint pending review."""
    complaint = get_object_or_404(Complaint, pk=pk)
    session_hash = get_session_hash(request)
    reason = str(request.data.get("reason", ""))[:500]
    try:
        FlaggedComplaint.objects.create(
            complaint=complaint, reason=reason, flagger_session_hash=session_hash
        )
    except IntegrityError:
        return Response({"detail": "You've already flagged this complaint."},
                        status=status.HTTP_409_CONFLICT)
    complaint.is_hidden = True
    complaint.save(update_fields=["is_hidden"])
    return Response({"detail": "Flag received. The complaint is hidden pending review."},
                    status=status.HTTP_201_CREATED)
