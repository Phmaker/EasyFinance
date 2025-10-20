from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import Category, Account, Transaction, BudgetGoal

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
        fields = ['id', 'name', 'type', 'user']

class AccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'balance', 'user']

    def get_balance(self, obj):
        income_sum = Transaction.objects.filter(account=obj, category__type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense_sum = Transaction.objects.filter(account=obj, category__type='expense').aggregate(total=Sum('amount'))['total'] or 0
        current_balance = obj.balance + income_sum - expense_sum
        return current_balance

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'description', 'amount', 'date', 'category', 'account', 'user', 
            'category_name', 'account_name', 'category_type'
        ]

class BudgetGoalSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    current_amount = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = BudgetGoal
        fields = [
            'id', 'name', 'goal_type', 'target_amount', 'current_amount',
            'category', 'category_name', 'start_date', 'end_date', 'user'
        ]
        read_only_fields = ['user', 'current_amount']

    def get_current_amount(self, obj):
        if obj.goal_type == 'spending_limit' and obj.category:
            spent_amount = Transaction.objects.filter(
                user=obj.user,
                category=obj.category,
                date__range=(obj.start_date, obj.end_date)
            ).aggregate(total=Sum('amount'))['total'] or 0
            return spent_amount
        return obj.current_amount

    def create(self, validated_data):
        if validated_data.get('goal_type') == 'saving_goal':
            # Usa self.initial_data para pegar o valor que veio do frontend antes da validação
            initial_current_amount = self.initial_data.get('current_amount', 0.00)
            validated_data['current_amount'] = initial_current_amount
        return super().create(validated_data)