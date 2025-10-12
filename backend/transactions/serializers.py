# transactions/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import Category, Account, Transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = Category
        fields = ['id', 'name', 'user']

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    # 👇 MUDANÇA PRINCIPAL AQUI 👇
    # Este campo não virá mais diretamente do banco, será calculado pelo método abaixo
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        # O campo 'balance' agora se refere ao método, não mais ao campo do BD
        fields = ['id', 'name', 'type', 'balance', 'user']

    def get_balance(self, obj):
        """
        Calcula o saldo atual da conta:
        Saldo Inicial + Soma das Receitas - Soma das Despesas
        """
        # obj é a instância da conta (ex: a conta 'Inter')
        
        # Soma de todas as receitas para esta conta
        income_sum = Transaction.objects.filter(
            account=obj, 
            type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Soma de todas as despesas para esta conta
        expense_sum = Transaction.objects.filter(
            account=obj, 
            type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # O campo 'balance' do modelo agora é tratado como o saldo inicial
        current_balance = obj.balance + income_sum - expense_sum
        return current_balance

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    class Meta:
        model = Transaction
        fields = ['id', 'description', 'amount', 'type', 'date', 'category', 'account', 'user', 'category_name', 'account_name']