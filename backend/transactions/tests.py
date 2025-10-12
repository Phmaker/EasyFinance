
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Cria um roteador para registrar nossos ViewSets
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'accounts', views.AccountViewSet, basename='account') # 👈 Adicionado
router.register(r'transactions', views.TransactionViewSet, basename='transaction') # 👈 Adicionado

# As URLs da API são determinadas automaticamente pelo roteador
urlpatterns = [
    path('', include(router.urls)),
]