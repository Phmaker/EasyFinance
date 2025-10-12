# transactions/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Rotas de CRUD
    path('categories/', views.CategoryListCreate.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('accounts/', views.AccountListCreate.as_view(), name='account-list-create'),
    path('accounts/<int:pk>/', views.AccountDetail.as_view(), name='account-detail'),
    path('transactions/', views.TransactionListCreate.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view(), name='transaction-detail'),

    # ROTA UNIFICADA DO DASHBOARD
    path('dashboard/', views.DashboardData.as_view(), name='dashboard-data'),
    path('user/profile/', views.UserProfileView.as_view(), name='user-profile'),
]