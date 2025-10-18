from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    # 1. Os tipos de transação agora são definidos aqui
    CATEGORY_TYPES = [
        ('expense', 'Despesa'),
        ('income', 'Receita'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    # 2. O campo 'type' foi adicionado à categoria
    type = models.CharField("Tipo", max_length=7, choices=CATEGORY_TYPES, default='expense')

    def __str__(self):
        return self.name
    
    class Meta:
        # Garante que um usuário não pode ter duas categorias com o mesmo nome
        unique_together = ('user', 'name')

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, default='Conta Corrente') 
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class Transaction(models.Model):
    # 3. O campo 'type' foi REMOVIDO daqui
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    description = models.CharField(max_length=255)
    amount = models.DecimalField("Valor", max_digits=10, decimal_places=2)
    date = models.DateField()
    # 4. A categoria agora é obrigatória e protegida contra exclusão
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.description} - {self.amount}"