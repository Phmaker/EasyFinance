# transactions/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from datetime import date, timedelta

from .models import Category, Account, Transaction
from .serializers import CategorySerializer, AccountSerializer, TransactionSerializer, UserSerializer

# --- Views de CRUD (não mudam) ---
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

class TransactionListCreate(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by('-date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = TransactionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

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

# --- VIEW UNIFICADA DO DASHBOARD (COM LÓGICA CORRIGIDA) ---
class DashboardData(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        user = request.user

        # --- 1. Cálculos de Saldo (Real e Projetado) ---
        initial_balance_sum = Account.objects.filter(user=user).aggregate(total=Sum('balance'))['total'] or 0
        past_present_income = Transaction.objects.filter(user=user, type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        past_present_expense = Transaction.objects.filter(user=user, type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        actual_balance = initial_balance_sum + past_present_income - past_present_expense
        future_income = Transaction.objects.filter(user=user, type='income', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        future_expense = Transaction.objects.filter(user=user, type='expense', date__gt=today).aggregate(total=Sum('amount'))['total'] or 0
        projected_balance = actual_balance + future_income - future_expense

        # --- 2. Resumo Mensal ---
        # Receitas realizadas até hoje
        monthly_income = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='income', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        
        # Despesas TOTAIS do mês (incluindo futuras), como solicitado
        monthly_expenses = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        # Lucro líquido realizado até hoje
        expenses_until_today = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense', date__lte=today).aggregate(total=Sum('amount'))['total'] or 0
        net_profit = monthly_income - expenses_until_today

        # Lógica de variação do Lucro Líquido
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

        # --- 3. Gráfico de Despesas (apenas despesas até hoje) ---
        expense_summary = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month, type='expense', date__lte=today).values('category__name').annotate(total=Sum('amount')).order_by('-total')
        chart_labels = [item['category__name'] for item in expense_summary]
        chart_data = [item['total'] for item in expense_summary]
        
        # --- 4. Próximos Lançamentos ---
        upcoming = Transaction.objects.filter(user=user, date__gte=today).order_by('date')[:4]
        upcoming_serializer = TransactionSerializer(upcoming, many=True)

        # --- Montando a Resposta ---
        data = {
            "summary": {
                "actual_balance": actual_balance,
                "projected_balance": projected_balance,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "net_profit": net_profit,
                "net_profit_variation": round(profit_variation, 2)
            },
            "expense_chart": {"labels": chart_labels, "data": chart_data},
            "upcoming_transactions": upcoming_serializer.data
        }
        return Response(data)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Retorna os dados do usuário logado. """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """ Atualiza os dados do usuário logado. """
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True) # partial=True permite atualizações parciais
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
