"""
Django settings for easyfinances_api project.
"""

from pathlib import Path
from datetime import timedelta 

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-qpqvo1*nhctye+)(8mhl!729zf28&zdgey7hp06@@-yy+9hjg2'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# 🚀 CORREÇÃO CRÍTICA: Adicionando o IP de rede em uso (192.168.15.19) e o curinga '*' para desenvolvimento.
ALLOWED_HOSTS = [
    "127.0.0.1", 
    "localhost", 
    "192.168.56.1", 
    "26.46.76.200", 
    "192.168.15.19", # Seu IP atual
    "*"             # Permite qualquer host em desenvolvimento
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    'transactions',
    'rest_framework',
    # Ativação do CORS
    'corsheaders',
    # Ativação do Simple JWT
    'rest_framework_simplejwt', 
]

# 🚀 CORREÇÃO CRÍTICA: Ordem do Middleware ajustada
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # CORS deve vir antes do CommonMiddleware e SessionMiddleware
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


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'easyfinances_db', 
        'USER': 'root', 
        'PASSWORD': 'admin', 
        'HOST': 'localhost', 
        'PORT': '3306', 
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# 🚀 CORS CONFIGURATION 
# CORREÇÃO CRÍTICA: Incluindo o IP de rede do seu Next.js no celular
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://26.46.76.200:3000",
    "http://192.168.56.1:3000",
    "http://192.168.15.19:3000",  # <--- SEU IP DE ACESSO VIA CELULAR
]

# NECESSÁRIO para enviar cookies, tokens, etc., em requisições cross-origin
CORS_ALLOW_CREDENTIALS = True

# 🚀 CONFIGURAÇÃO CSRF: Essencial para POSTs cross-origin
CSRF_TRUSTED_ORIGINS = [
    "http://192.168.15.19:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

APPEND_SLASH = False


# CONFIGURAÇÃO DO REST FRAMEWORK E JWT
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