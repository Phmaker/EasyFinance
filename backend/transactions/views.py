# transactions/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from datetime import date, timedelta
from rest_framework import generics
from django.utils import timezone
from dateutil.relativedelta import relativedelta # <-- 1. Importe esta biblioteca

from .models import Category, Account, Transaction
from .serializers import CategorySerializer, AccountSerializer, TransactionSerializer, UserSerializer

# --- Views de CRUD (sem alterações) ---
class CreateUserView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class CategoryListCreate(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        categories = Category.objects.filter(user=request.user)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class CategoryDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk, user):
        return get_object_or_404(Category, pk=pk, user=user)
    def put(self, request, pk):
        category = self.get_object(pk, request.user)
        serializer = CategorySerializer(category, data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
    def delete(self, request, pk):
        category = self.get_object(pk, request.user)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AccountListCreate(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        accounts = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(accounts, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = AccountSerializer(data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class AccountDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk, user):
        return get_object_or_404(Account, pk=pk, user=user)
    def put(self, request, pk):
        account = self.get_object(pk, request.user)
        serializer = AccountSerializer(account, data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
    def delete(self, request, pk):
        account = self.get_object(pk, request.user)
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TransactionListCreate(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(user=user).order_by('-date')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk, user):
        return get_object_or_404(Transaction, pk=pk, user=user)
    def put(self, request, pk):
        transaction = self.get_object(pk, request.user)
        serializer = TransactionSerializer(transaction, data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
    def delete(self, request, pk):
        transaction = self.get_object(pk, request.user)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- VIEW DA HOME PAGE (sem alterações) ---
class DashboardData(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        today = date.today()
        user = request.user
        # ... (toda a sua lógica existente continua aqui, sem mudanças)
        initial_balance_sum = Account.objects.filter(user=user).aggregate(total=Sum('balance'))['total'] or 0
        past_present_income = Transaction.objects.filter(user=user, type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        past_present_expense = Transaction.objects.filter(user=user, type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        actual_balance = initial_balance_sum + past_present_income - past_present_expense
        future_income = Transaction.objects.filter(user=user, type='income', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        future_expense = Transaction.objects.filter(user=user, type='expense', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        projected_balance = actual_balance + future_income - future_expense
        monthly_income = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        monthly_expenses = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense').aggregate(total=Sum('amount'))['total'] or 0
        expenses_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        net_profit = monthly_income - expenses_until_today
        first_day_current_month = today.replace(day=1)
        last_day_previous_month = first_day_current_month - timedelta(days=1)
        previous_month_transactions = Transaction.objects.filter(user=user, date__year=last_day_previous_month.year, date__month=last_day_previous_month.month)
        previous_income = previous_month_transactions.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        previous_expenses = previous_month_transactions.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
        previous_net_profit = previous_income - previous_expenses
        profit_variation = 0
        if previous_net_profit != 0:
            profit_variation = ((net_profit - previous_net_profit) / abs(previous_net_profit)) * 100
        elif net_profit > 0:
            profit_variation = 100
        expense_summary = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense', date__lte=today).values('category__name').annotate(total=Sum('amount')).order_by('-total')
        chart_labels = [item['category__name'] for item in expense_summary]
        chart_data = [item['total'] for item in expense_summary]
        upcoming = Transaction.objects.filter(user=user, date__gte=today).order_by('date')[:4]
        upcoming_serializer = TransactionSerializer(upcoming, many=True)
        data = {
            "summary": {
                "actual_balance": actual_balance,"projected_balance": projected_balance,
                "monthly_income": monthly_income,"monthly_expenses": monthly_expenses,
                "net_profit": net_profit,"net_profit_variation": round(profit_variation, 2)
            },
            "expense_chart": {"labels": chart_labels, "data": chart_data},
            "upcoming_transactions": upcoming_serializer.data
        }
        return Response(data)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        if not current_password or not new_password:
            return Response({"error": "Todos os campos são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(current_password):
            return Response({"error": "A senha atual está incorreta."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({"message": "Senha alterada com sucesso!"}, status=status.HTTP_200_OK)

# --- NOVAS VIEWS PARA O DASHBOARD DE ANÁLISE ---

# 2. Adicione esta função auxiliar
def get_date_range(period_str):
    today = timezone.now().date()
    if period_str == 'this_month':
        start_date = today.replace(day=1)
        end_date = today
    elif period_str == 'last_month':
        last_month_end = today.replace(day=1) - timedelta(days=1)
        start_date = last_month_end.replace(day=1)
        end_date = last_month_end
    elif period_str == 'last_90_days':
        start_date = today - timedelta(days=90)
        end_date = today
    elif period_str == 'this_year':
        start_date = today.replace(month=1, day=1)
        end_date = today
    else: # Padrão
        start_date = today.replace(day=1)
        end_date = today
    return start_date, end_date

# 3. Adicione esta nova View para a página /dashboard
class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date = get_date_range(period)

        # KPIs para o período selecionado
        income_in_period = Transaction.objects.filter(user=user, type='income', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0
        expenses_in_period = Transaction.objects.filter(user=user, type='expense', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0
        net_profit_in_period = income_in_period - expenses_in_period

        data = {
            "kpis": {
                "income": income_in_period,
                "expenses": expenses_in_period,
                "net_profit": net_profit_in_period,
            }
        }
        return Response(data)

# 4. Adicione esta View para o relatório de categorias
class CategorySummaryReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date = get_date_range(period)

        summary = Transaction.objects.filter(
            user=user, type='expense', date__range=(start_date, end_date)
        ).values('category__name').annotate(total=Sum('amount')).order_by('-total')

        return Response(list(summary))