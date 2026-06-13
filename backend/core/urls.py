from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("complaints/", views.create_complaint, name="complaint-create"),
    path("complaints/<uuid:pk>/confirm/", views.confirm_complaint, name="complaint-confirm"),
    path("complaints/<uuid:pk>/flag/", views.flag_complaint, name="complaint-flag"),
    path("buildings/", views.list_buildings, name="building-list"),
    path("buildings/<uuid:pk>/", views.building_detail, name="building-detail"),
]
