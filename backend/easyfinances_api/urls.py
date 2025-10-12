# easyfinances_api/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# A view de registro provavelmente está em 'transactions.views'
from transactions.views import CreateUserView 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Autenticação
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    
    # MUDANÇA: Agora, qualquer URL que comece com 'api/' será procurada em 'transactions.urls'
    path('api/', include('transactions.urls')),
]