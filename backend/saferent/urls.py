from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    # OpenAPI schema (raw JSON/YAML)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Interactive Swagger UI — try requests right from the browser
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Optional alternative ReDoc viewer
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
