from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_name', 'contact_email', 'campaign', 'status', 'lead_score', 'created_at')
    list_filter = ('status', 'campaign', 'industry', 'country')
    search_fields = ('company_name', 'contact_name', 'contact_email')
