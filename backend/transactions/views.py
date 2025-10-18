from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from datetime import date, timedelta
from rest_framework import generics
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from .models import Category, Account, Transaction
from .serializers import CategorySerializer, AccountSerializer, TransactionSerializer, UserSerializer

# --- Views de CRUD (sem alterações) ---
# ... (suas views de CRUD, como CreateUserView, CategoryListCreate, etc., continuam aqui sem mudanças) ...
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
        
# --- VIEW DA HOME PAGE (CORRIGIDA) ---
class DashboardData(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        today = timezone.now().date()
        user = request.user
        
        initial_balance_sum = Account.objects.filter(user=user).aggregate(total=Sum('balance'))['total'] or 0
        
        # --- CORREÇÃO AQUI ---
        past_present_income = Transaction.objects.filter(user=user, category__type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        past_present_expense = Transaction.objects.filter(user=user, category__type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        actual_balance = initial_balance_sum + past_present_income - past_present_expense
        
        # --- CORREÇÃO AQUI ---
        future_income = Transaction.objects.filter(user=user, category__type='income', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        future_expense = Transaction.objects.filter(user=user, category__type='expense', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        projected_balance = actual_balance + future_income - future_expense
        
        # --- CORREÇÃO AQUI ---
        monthly_income = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='income').aggregate(total=Sum('amount'))['total'] or 0
        monthly_expenses = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        # --- CORREÇÃO AQUI ---
        income_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        expenses_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        net_profit = income_until_today - expenses_until_today
        
        last_month_end = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        
        # --- CORREÇÃO AQUI ---
        previous_income = Transaction.objects.filter(user=user, category__type='income', date__range=(last_month_start, last_month_end)).aggregate(total=Sum('amount'))['total'] or 0
        previous_expenses = Transaction.objects.filter(user=user, category__type='expense', date__range=(last_month_start, last_month_end)).aggregate(total=Sum('amount'))['total'] or 0
        previous_net_profit = previous_income - previous_expenses
        
        profit_variation = 0
        if previous_net_profit != 0:
            profit_variation = ((net_profit - previous_net_profit) / abs(previous_net_profit)) * 100
        elif net_profit > 0:
            profit_variation = 100

        # --- CORREÇÃO AQUI ---
        expense_summary = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='expense').values('category__name').annotate(total=Sum('amount')).order_by('-total')
        
        chart_labels = [item['category__name'] for item in expense_summary if item['category__name']]
        chart_data = [item['total'] for item in expense_summary if item['category__name']]

        upcoming = Transaction.objects.filter(user=user, date__gte=today).order_by('date')
        upcoming_serializer = TransactionSerializer(upcoming, many=True)
        
        data = {
            "summary": { "actual_balance": actual_balance, "projected_balance": projected_balance, "monthly_income": monthly_income, "monthly_expenses": monthly_expenses, "net_profit": net_profit, "net_profit_variation": round(profit_variation, 2) },
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
        # ... sua lógica existente
        return Response({})

# --- VIEWS PARA O DASHBOARD DE ANÁLISE (CORRIGIDAS) ---
def get_date_range(period_str):
    today = timezone.now().date()
    if period_str == 'this_month':
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
        prev_start_date = start_date - relativedelta(months=1)
        prev_end_date = start_date - timedelta(days=1)
    elif period_str == 'last_month':
        end_date = today.replace(day=1) - timedelta(days=1)
        start_date = end_date.replace(day=1)
        prev_start_date = start_date - relativedelta(months=1)
        prev_end_date = start_date - timedelta(days=1)
    elif period_str == 'last_90_days':
        start_date = today - timedelta(days=89)
        end_date = today
        prev_start_date = start_date - timedelta(days=90)
        prev_end_date = start_date - timedelta(days=1)
    elif period_str == 'this_year':
        start_date = today.replace(month=1, day=1)
        end_date = today.replace(month=12, day=31) 
        prev_start_date = start_date - relativedelta(years=1)
        prev_end_date = start_date - timedelta(days=1)
    else: # Fallback
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
        prev_start_date = start_date - relativedelta(months=1)
        prev_end_date = start_date - timedelta(days=1)
    return start_date, end_date, prev_start_date, prev_end_date

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date, prev_start_date, prev_end_date = get_date_range(period)

        current_transactions = Transaction.objects.filter(user=user, date__range=(start_date, end_date))
        prev_transactions = Transaction.objects.filter(user=user, date__range=(prev_start_date, prev_end_date))

        # --- CORREÇÃO AQUI ---
        kpis = {
            'income': current_transactions.filter(category__type='income').aggregate(total=Sum('amount'))['total'] or 0,
            'expenses': current_transactions.filter(category__type='expense').aggregate(total=Sum('amount'))['total'] or 0,
            'income_transactions': current_transactions.filter(category__type='income').count(),
            'expense_transactions': current_transactions.filter(category__type='expense').count(),
        }
        kpis['net_profit'] = kpis['income'] - kpis['expenses']
        
        effective_days_end = min(end_date, timezone.now().date())
        num_days = (effective_days_end - start_date).days + 1
        
        # --- CORREÇÃO AQUI ---
        expenses_until_today = current_transactions.filter(
            category__type='expense', date__lte=effective_days_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        kpis['average_daily_expense'] = expenses_until_today / num_days if num_days > 0 else 0
        
        # --- CORREÇÃO AQUI ---
        top_category_query = current_transactions.filter(category__type='expense') \
            .values('category__name') \
            .annotate(total=Sum('amount')) \
            .order_by('-total').first()

        if top_category_query and top_category_query['category__name']:
            kpis['top_expense_category'] = { 'name': top_category_query['category__name'], 'amount': top_category_query['total'] }
        else:
            kpis['top_expense_category'] = None

        # --- CORREÇÃO AQUI ---
        prev_income = prev_transactions.filter(category__type='income').aggregate(total=Sum('amount'))['total'] or 0
        prev_expenses = prev_transactions.filter(category__type='expense').aggregate(total=Sum('amount'))['total'] or 0

        def calculate_pct_change(current, previous):
            if previous > 0: return ((current - previous) / previous) * 100
            if current > 0: return 100
            return 0

        comparison = {
            'income_pct_change': calculate_pct_change(kpis['income'], prev_income),
            'expenses_pct_change': calculate_pct_change(kpis['expenses'], prev_expenses)
        }

        data = { "kpis": kpis, "comparison": comparison }
        return Response(data)

class CategorySummaryReport(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date = get_date_range(period)[:2]

        # --- CORREÇÃO AQUI ---
        summary = Transaction.objects.filter(
            user=user, category__type='expense', date__range=(start_date, end_date)
        ).values('category__name').annotate(total=Sum('amount')).order_by('-total')

        return Response(list(summary))

class UserCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')

class CategoryDetailsAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        category_name = request.query_params.get('name')
        period = request.query_params.get('period', 'this_month')

        if not category_name:
            return Response({"error": "O nome da categoria é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        start_date, end_date, _, _ = get_date_range(period)
        
        try:
            category_obj = Category.objects.get(user=user, name=category_name)
        except Category.DoesNotExist:
            return Response({"error": "Categoria não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        category_transactions = Transaction.objects.filter(
            user=user, 
            category=category_obj,
            date__range=(start_date, end_date)
        )
        
        # Lógica otimizada: não precisamos mais filtrar por 'type' aqui
        income = 0
        expenses = 0
        if category_obj.type == 'income':
            income = category_transactions.aggregate(total=Sum('amount'))['total'] or 0
        else:
            expenses = category_transactions.aggregate(total=Sum('amount'))['total'] or 0
        
        # A lógica da porcentagem precisa ser ajustada
        total_in_period = 0
        if category_obj.type == 'expense':
            total_in_period = Transaction.objects.filter(user=user, category__type='expense', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0
        elif category_obj.type == 'income':
            total_in_period = Transaction.objects.filter(user=user, category__type='income', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0

        current_total = income if category_obj.type == 'income' else expenses
        percentage = (current_total / total_in_period) * 100 if total_in_period > 0 else 0

        data = { "income": income, "expenses": expenses, "percentage": percentage, "type": category_obj.type }
        return Response(data)