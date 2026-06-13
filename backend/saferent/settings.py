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

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
)
# Read .env if present (local dev); on Render, env vars come from the dashboard.
environ.Env.read_env(BASE_DIR / ".env")

# GeoDjango: newer GDAL versions (3.8+) aren't in Django 5.0's auto-detect
# list, so allow explicit paths and fall back to a glob search.
import ctypes.util, glob

GDAL_LIBRARY_PATH = env("GDAL_LIBRARY_PATH", default=None) or ctypes.util.find_library("gdal")
if not GDAL_LIBRARY_PATH:
    _candidates = glob.glob("/usr/lib/*/libgdal.so*") + glob.glob("/usr/lib/libgdal.so*")
    GDAL_LIBRARY_PATH = sorted(_candidates)[0] if _candidates else None

SECRET_KEY = env("SECRET_KEY", default="dev-only-insecure-key-change-me")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
# Render injects the service's public hostname here — add it automatically so we
# don't have to hardcode/guess the exact subdomain.
_render_host = env("RENDER_EXTERNAL_HOSTNAME", default=None)
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

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
# In production the frontend (Vercel) and API (Render) are different sites, so the
# session cookie must be SameSite=None + Secure to be sent on cross-site requests.
# In local dev (same-origin via Vite proxy) Lax is correct and avoids requiring HTTPS.
SESSION_COOKIE_SAMESITE = "Lax" if DEBUG else "None"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "Lax" if DEBUG else "None"
CSRF_COOKIE_SECURE = not DEBUG

# Render terminates TLS at its proxy; trust the forwarded-proto header so Django
# knows the request is HTTPS (required for Secure cookies to be set).
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000          # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True            # session cookie must travel with API calls
CSRF_TRUSTED_ORIGINS = env("CORS_ALLOWED_ORIGINS")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],   # anonymous by design
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",                   # global safety net; per-endpoint limits later
        "complaints": "10/hour",            # spec: max 10 complaint submissions/hour
    },
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
