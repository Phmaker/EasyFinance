from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import Category, Account, Transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Category
        # 1. CORREÇÃO: Adicionado o campo 'type' para que ele seja salvo e exibido
        fields = ['id', 'name', 'type', 'user']

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'balance', 'user']

    def get_balance(self, obj):
        """
        Calcula o saldo atual da conta:
        Saldo Inicial + Soma das Receitas - Soma das Despesas
        """
        # 2. CORREÇÃO: Filtra as transações pelo TIPO DA CATEGORIA
        income_sum = Transaction.objects.filter(
            account=obj, 
            category__type='income' # Alterado de 'type' para 'category__type'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 3. CORREÇÃO: Filtra as transações pelo TIPO DA CATEGORIA
        expense_sum = Transaction.objects.filter(
            account=obj, 
            category__type='expense' # Alterado de 'type' para 'category__type'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # O saldo inicial continua vindo do campo 'balance' do modelo
        current_balance = obj.balance + income_sum - expense_sum
        return current_balance

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    # Melhoria: Adiciona o tipo da categoria para fácil acesso no frontend
    category_type = serializers.CharField(source='category.type', read_only=True)
    
    class Meta:
        model = Transaction
        # 4. CORREÇÃO: Removido o campo 'type' que não existe mais na Transaction
        fields = [
            'id', 'description', 'amount', 'date', 'category', 'account', 'user', 
            'category_name', 'account_name', 'category_type'
        ]