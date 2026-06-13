from django.db import connection
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response


@api_view(["GET"])
@throttle_classes([])  # health checks shouldn't burn the anon rate limit
def health(request):
    """Walking-skeleton endpoint: proves app + DB + PostGIS are alive."""
    db_ok, postgis_version = False, None
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT PostGIS_Version();")
            postgis_version = cur.fetchone()[0]
            db_ok = True
    except Exception:
        pass
    return Response({"status": "ok", "db": db_ok, "postgis": postgis_version})
