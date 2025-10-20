from django.db import models
from django.contrib.auth.models import User
from django.conf import settings # É uma boa prática usar settings.AUTH_USER_MODEL

class Category(models.Model):
    CATEGORY_TYPES = [
        ('expense', 'Despesa'),
        ('income', 'Receita'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField("Tipo", max_length=7, choices=CATEGORY_TYPES, default='expense')

    def __str__(self):
        return self.name
    
    class Meta:
        unique_together = ('user', 'name')

class Account(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, default='Conta Corrente') 
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    description = models.CharField(max_length=255)
    amount = models.DecimalField("Valor", max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)

    # --- 👇 CAMPOS ADICIONADOS PARA RECORRÊNCIA E PAGAMENTO 👇 ---

    # Campo para a funcionalidade "Já Paguei" permanente
    paid = models.BooleanField(default=False)

    # Marca a transação "Pai" como o molde para a recorrência.
    is_recurring = models.BooleanField(default=False)
    
    # Define a frequência. Começaremos com 'mensal', mas a estrutura permite expandir no futuro.
    recurrence_interval = models.CharField(max_length=20, choices=[('monthly', 'Mensal')], null=True, blank=True)
    
    # Data final para a criação de novas recorrências.
    recurrence_end_date = models.DateField(null=True, blank=True)

    # O campo mais importante: liga as transações "filhas" à transação "pai" (o molde).
    # Isso nos permite encontrar e modificar toda a série de recorrências.
    parent_transaction = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='recurrences'
    )

    def __str__(self):
        return f"{self.description} - {self.amount}"
    
class BudgetGoal(models.Model):
    GOAL_TYPES = [
        ('spending_limit', 'Limite de Gasto'),
        ('saving_goal', 'Meta de Economia'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField("Nome da Meta", max_length=100)
    goal_type = models.CharField("Tipo da Meta", max_length=15, choices=GOAL_TYPES)
    target_amount = models.DecimalField("Valor Alvo", max_digits=10, decimal_places=2)
    current_amount = models.DecimalField("Valor Atual (Economia)", max_digits=10, decimal_places=2, default=0.00)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True, limit_choices_to={'type': 'expense'})
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.name} ({self.get_goal_type_display()})"