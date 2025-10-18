from django.contrib import admin
from .models import Category, Account, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    # Melhoria: Exibir e filtrar por tipo na lista de categorias
    list_display = ("name", "type", "user")
    search_fields = ("name",)
    list_filter = ("user", "type")

    
@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    # Melhoria: Exibir tipo e saldo para mais clareza
    list_display = ("name", "type", "balance", "user")
    search_fields = ("name",)
    list_filter = ("user", "type")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    # Correção: O campo 'type' agora é acessado através da categoria
    list_display = ("description", "get_valor", "category__type", "date", "user", "account", "category")
    list_filter = ("category__type", "date", "category", "account")
    search_fields = ("description",)
    
    def get_valor(self, obj):
        # Formatando o valor para o padrão brasileiro (BRL)
        return f"R$ {obj.amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    get_valor.short_description = "Valor"