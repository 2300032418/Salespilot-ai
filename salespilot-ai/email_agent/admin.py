from django.contrib import admin
from .models import EmailDraft


@admin.register(EmailDraft)
class EmailDraftAdmin(admin.ModelAdmin):
    list_display  = ('id', 'lead', 'subject', 'tone', 'status', 'approved', 'created_at')
    list_filter   = ('status', 'tone', 'approved')
    search_fields = ('subject', 'lead__company_name', 'lead__contact_email')
    readonly_fields = ('created_at', 'updated_at')
    ordering      = ('-created_at',)
