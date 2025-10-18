from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Rotas de Autenticação
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.CreateUserView.as_view(), name='register'),
    
    # Rotas de CRUD
    path('categories/', views.CategoryListCreate.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('accounts/', views.AccountListCreate.as_view(), name='account-list-create'),
    path('accounts/<int:pk>/', views.AccountDetail.as_view(), name='account-detail'),
    path('transactions/', views.TransactionListCreate.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view(), name='transaction-detail'),

    # Rota da Home Page (resumo rápido)
    path('dashboard/', views.DashboardData.as_view(), name='dashboard-data'),
    
    # Rotas do Usuário
    path('user/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('user/change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # Rotas para o Dashboard de Análise
    path('analytics/', views.AnalyticsView.as_view(), name='analytics-data'),
    path('reports/category-summary/', views.CategorySummaryReport.as_view(), name='category-summary-report'),
    
    # --- ROTA QUE FALTAVA ---
    # Rota para buscar a lista de categorias do usuário para o dropdown
    path('categories/user-list/', views.UserCategoryListView.as_view(), name='user-category-list'),
    path('analytics/category-details/', views.CategoryDetailsAnalyticsView.as_view(), name='analytics-category-details'),
]