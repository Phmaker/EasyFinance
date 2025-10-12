from django.contrib import admin
from .models import Category, Account, Transaction



@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user")
    search_fields = ("name",)
    list_filter = ("user",)

    
@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "user")
    search_fields = ("name",)
    list_filter = ("user",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("description", "get_valor", "type", "date", "user", "account", "category")
    list_filter = ("type", "date", "category", "account")
    search_fields = ("description",)
    
    def get_valor(self, obj):
        return f"R$ {obj.amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    get_valor.short_description = "Valor"
 
# Register your models here.
