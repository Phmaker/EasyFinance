from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from decimal import Decimal, InvalidOperation
from datetime import date, timedelta

from .models import Category, Account, Transaction, BudgetGoal
from .serializers import CategorySerializer, AccountSerializer, TransactionSerializer, UserSerializer, BudgetGoalSerializer

# --- Views de Autenticação e Usuário ---

class CreateUserView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

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

# --- Views de CRUD ---

class CategoryListCreate(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')

class CategoryDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Transaction.objects.filter(category=instance).exists():
            return Response({"error": "Não é possível excluir uma categoria que já está em uso."}, status=status.HTTP_400_BAD_REQUEST)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class AccountListCreate(generics.ListCreateAPIView):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

class AccountDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

class TransactionListCreate(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

# --- VIEWS PARA METAS ---

class BudgetGoalView(generics.ListCreateAPIView):
    serializer_class = BudgetGoalSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None # <-- A LINHA MAIS IMPORTANTE PARA RESOLVER O PROBLEMA

    def get_queryset(self):
        return BudgetGoal.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        if self.request.data.get('goal_type') == 'spending_limit' and not self.request.data.get('category'):
            raise serializers.ValidationError({'category': 'Metas de limite de gasto devem estar associadas a uma categoria.'})
        serializer.save(user=self.request.user)

class BudgetGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetGoalSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return BudgetGoal.objects.filter(user=self.request.user)

class AddSavingProgressView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        goal = get_object_or_404(BudgetGoal, pk=pk, user=request.user)
        if goal.goal_type != 'saving_goal':
            return Response({'error': 'Esta função é apenas para metas de economia.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_to_add = Decimal(request.data.get('amount'))
            if amount_to_add <= 0:
                raise ValueError
        except (TypeError, ValueError, InvalidOperation):
            return Response({'error': 'Forneça um valor numérico positivo para adicionar.'}, status=status.HTTP_400_BAD_REQUEST)
        goal.current_amount += amount_to_add
        goal.save()
        serializer = BudgetGoalSerializer(goal, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- VIEWS DE DASHBOARD E ANÁLISE ---

def get_date_range(period_str):
    today = timezone.now().date()
    if period_str == 'this_month':
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
    elif period_str == 'last_month':
        end_date = today.replace(day=1) - timedelta(days=1)
        start_date = end_date.replace(day=1)
    elif period_str == 'last_90_days':
        start_date = today - timedelta(days=89)
        end_date = today
    elif period_str == 'this_year':
        start_date = today.replace(month=1, day=1)
        end_date = today.replace(month=12, day=31)
    else: # Fallback
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
    return start_date, end_date

class DashboardData(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        today = timezone.now().date()
        user = request.user
        
        initial_balance_sum = Account.objects.filter(user=user).aggregate(total=Sum('balance'))['total'] or 0
        past_present_income = Transaction.objects.filter(user=user, category__type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        past_present_expense = Transaction.objects.filter(user=user, category__type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        actual_balance = initial_balance_sum + past_present_income - past_present_expense
        future_income = Transaction.objects.filter(user=user, category__type='income', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        future_expense = Transaction.objects.filter(user=user, category__type='expense', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        projected_balance = actual_balance + future_income - future_expense
        monthly_income = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='income').aggregate(total=Sum('amount'))['total'] or 0
        monthly_expenses = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='expense').aggregate(total=Sum('amount'))['total'] or 0
        income_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        expenses_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, category__type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        net_profit = income_until_today - expenses_until_today
        last_month_end = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        previous_income = Transaction.objects.filter(user=user, category__type='income', date__range=(last_month_start, last_month_end)).aggregate(total=Sum('amount'))['total'] or 0
        previous_expenses = Transaction.objects.filter(user=user, category__type='expense', date__range=(last_month_start, last_month_end)).aggregate(total=Sum('amount'))['total'] or 0
        previous_net_profit = previous_income - previous_expenses
        profit_variation = 0
        if previous_net_profit != 0:
            profit_variation = ((net_profit - previous_net_profit) / abs(previous_net_profit)) * 100
        elif net_profit > 0:
            profit_variation = 100
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

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date = get_date_range(period)
        current_transactions = Transaction.objects.filter(user=user, date__range=(start_date, end_date))
        kpis = {
            'income': current_transactions.filter(category__type='income').aggregate(total=Sum('amount'))['total'] or 0,
            'expenses': current_transactions.filter(category__type='expense').aggregate(total=Sum('amount'))['total'] or 0,
            'income_transactions': current_transactions.filter(category__type='income').count(),
            'expense_transactions': current_transactions.filter(category__type='expense').count(),
        }
        kpis['net_profit'] = kpis['income'] - kpis['expenses']
        effective_days_end = min(end_date, timezone.now().date())
        num_days = (effective_days_end - start_date).days + 1 if effective_days_end >= start_date else 1
        expenses_until_today = current_transactions.filter(category__type='expense', date__lte=effective_days_end).aggregate(total=Sum('amount'))['total'] or 0
        kpis['average_daily_expense'] = expenses_until_today / num_days if num_days > 0 else 0
        top_category_query = current_transactions.filter(category__type='expense').values('category__name').annotate(total=Sum('amount')).order_by('-total').first()
        if top_category_query and top_category_query.get('category__name'):
            kpis['top_expense_category'] = { 'name': top_category_query['category__name'], 'amount': top_category_query['total'] }
        else:
            kpis['top_expense_category'] = None
        income_composition = list(current_transactions.filter(category__type='income').values('category__name').annotate(total=Sum('amount')).order_by('-total'))
        expense_composition = list(current_transactions.filter(category__type='expense').values('category__name').annotate(total=Sum('amount')).order_by('-total'))
        trunc_kind = TruncMonth if period == 'this_year' else TruncWeek
        income_timeseries = { str(item['period']): float(item['total']) for item in current_transactions.filter(category__type='income').annotate(period=trunc_kind('date')).values('period').annotate(total=Sum('amount')).order_by('period') }
        expense_timeseries = { str(item['period']): float(item['total']) for item in current_transactions.filter(category__type='expense').annotate(period=trunc_kind('date')).values('period').annotate(total=Sum('amount')).order_by('period') }
        all_dates = sorted(list(set(income_timeseries.keys()) | set(expense_timeseries.keys())))
        labels = [date.fromisoformat(d).strftime('%b') if period == 'this_year' else date.fromisoformat(d).strftime('%d/%m') for d in all_dates]
        timeseries_data = {
            'labels': labels,
            'income_data': [income_timeseries.get(date, 0) for date in all_dates],
            'expense_data': [expense_timeseries.get(date, 0) for date in all_dates],
        }
        data = { 
            "kpis": kpis, 
            "income_composition": income_composition,
            "expense_composition": expense_composition,
            "timeseries_data": timeseries_data,
        }
        return Response(data)

class UserCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')

class CategorySummaryReport(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'this_month')
        start_date, end_date = get_date_range(period)
        summary = Transaction.objects.filter(user=user, category__type='expense', date__range=(start_date, end_date)).values('category__name').annotate(total=Sum('amount')).order_by('-total')
        return Response(list(summary))

class CategoryDetailsAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        category_name = request.query_params.get('name')
        period = request.query_params.get('period', 'this_month')
        if not category_name:
            return Response({"error": "O nome da categoria é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        start_date, end_date = get_date_range(period)
        try:
            category_obj = Category.objects.get(user=user, name=category_name)
        except Category.DoesNotExist:
            return Response({"error": "Categoria não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        category_transactions = Transaction.objects.filter(user=user, category=category_obj, date__range=(start_date, end_date))
        income = 0
        expenses = 0
        if category_obj.type == 'income':
            income = category_transactions.aggregate(total=Sum('amount'))['total'] or 0
        else:
            expenses = category_transactions.aggregate(total=Sum('amount'))['total'] or 0
        percentage = 0
        if category_obj.type == 'expense':
            total_expenses_in_period = Transaction.objects.filter(user=user, category__type='expense', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0
            if total_expenses_in_period > 0:
                percentage = (expenses / total_expenses_in_period) * 100
        elif category_obj.type == 'income':
            total_income_in_period = Transaction.objects.filter(user=user, category__type='income', date__range=(start_date, end_date)).aggregate(total=Sum('amount'))['total'] or 0
            if total_income_in_period > 0:
                percentage = (income / total_income_in_period) * 100
        data = { "income": income, "expenses": expenses, "percentage": percentage, "type": category_obj.type }
        return Response(data)