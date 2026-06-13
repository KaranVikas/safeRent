"""
SafeRent Django settings.

Senior-dev conventions applied:
- All secrets/config via environment variables (12-factor), with safe dev defaults.
- GeoDjango enabled (django.contrib.gis) for PostGIS point queries later.
- Anonymous sessions: signed-cookie-free, DB-backed Django sessions, no auth app needed yet.
- Privacy-by-design starts here: no IP logging middleware, minimal installed apps.
"""
from pathlib import Path
import environ
import os, platform, glob
import ctypes.util

if platform.system() == "Windows":
    OSGEO4W = r"C:\OSGeo4W"
    os.environ["OSGEO4W_ROOT"] = OSGEO4W
    os.environ["GDAL_DATA"] = OSGEO4W + r"\apps\gdal\share\gdal"
    os.environ["PROJ_LIB"] = OSGEO4W + r"\share\proj"
    os.environ["PATH"] = OSGEO4W + r"\bin;" + os.environ["PATH"]
    if os.path.isdir(OSGEO4W + r"\bin"):
        os.add_dll_directory(OSGEO4W + r"\bin")   # required on Python 3.8+

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
)
environ.Env.read_env(BASE_DIR / ".env")

# GeoDjango: newer GDAL versions (3.8+) aren't in Django 5.0's auto-detect
# list, so allow explicit paths and fall back to a glob search.
import ctypes.util, glob

# GeoDjango: find GDAL explicitly, since auto-detection misses newer versions.
GDAL_LIBRARY_PATH = env("GDAL_LIBRARY_PATH", default=None) or ctypes.util.find_library("gdal")
if not GDAL_LIBRARY_PATH:
    if platform.system() == "Windows":
        _candidates = glob.glob(r"C:\OSGeo4W\bin\gdal*.dll")
    else:
        _candidates = glob.glob("/usr/lib/*/libgdal.so*") + glob.glob("/usr/lib/libgdal.so*")
    GDAL_LIBRARY_PATH = sorted(_candidates)[-1] if _candidates else None

SECRET_KEY = env("SECRET_KEY", default="dev-only-insecure-key-change-me")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# GEOS often needs the same treatment on Windows.
if platform.system() == "Windows":
    _geos = glob.glob(r"C:\OSGeo4W\bin\geos_c*.dll")
    if _geos:
        GEOS_LIBRARY_PATH = sorted(_geos)[-1]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",          # GeoDjango / PostGIS
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "core",                        # our app: buildings, complaints, etc.
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "saferent.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "saferent.wsgi.application"

DATABASES = {
    "default": env.db_url(
        "DATABASE_URL",
        default="postgis://saferent:saferent_dev_only@localhost:5432/saferent",
    )
}
# Ensure the PostGIS engine is used even if DATABASE_URL says postgres://
DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"

# --- Anonymous sessions (core product mechanic) ---
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30   # 30 days, matches data-retention policy
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True            # session cookie must travel with API calls
CSRF_TRUSTED_ORIGINS = env("CORS_ALLOWED_ORIGINS")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],   # anonymous by design
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",                   # global safety net; per-endpoint limits later
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SafeRent API",
    "DESCRIPTION": "Anonymous, privacy-by-design API for buildings, complaints, etc.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,          # hide the raw /schema route from the docs UIs
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Toronto"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Privacy: keep logs free of request bodies / IPs by default.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
