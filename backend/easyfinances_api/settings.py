"""
Django settings for easyfinances_api project.
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- CONFIGURAÇÕES DE AMBIENTE ---
# Agora, todas as configurações sensíveis são lidas do arquivo .env
# Isso torna seu código seguro e portável para qualquer ambiente.
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost').split(',')

# --- APLICAÇÕES INSTALADAS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # WhiteNoise para servir arquivos estáticos em produção
    'whitenoise.runserver_nostatic', 
    'django.contrib.staticfiles',
    'django_extensions',
    'transactions',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt', 
]

# --- MIDDLEWARE ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise Middleware deve vir logo após o SecurityMiddleware
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'easyfinances_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'easyfinances_api.wsgi.application'

# --- BANCO DE DADOS ---
# Configuração flexível que lê a URL do banco de dados do .env
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL')
    )
}

# --- VALIDAÇÃO DE SENHA (sem alterações) ---
AUTH_PASSWORD_VALIDATORS = [
    # ...
]

# --- INTERNACIONALIZAÇÃO (sem alterações) ---
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# --- ARQUIVOS ESTÁTICOS ---
# URL para acessar os arquivos estáticos
STATIC_URL = 'static/'
# Pasta para onde o 'collectstatic' vai copiar todos os arquivos para produção
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# Configuração para o WhiteNoise encontrar e servir os arquivos de forma eficiente
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CONFIGURAÇÕES DE CORS e CSRF ---
# Lidas a partir de variáveis de ambiente, separadas por vírgula
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True
APPEND_SLASH = False

# --- CONFIGURAÇÃO DO REST FRAMEWORK E JWT (sem alterações) ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}