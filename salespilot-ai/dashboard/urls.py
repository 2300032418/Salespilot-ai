"""
URL routing for SalesPilot AI Dashboard & Analytics Module.
"""

from django.urls import path
from .views import (
    DashboardOverviewView,
    CampaignAnalyticsView,
    LeadAnalyticsView,
    EmailAnalyticsView,
)

urlpatterns = [
    path('', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('campaigns/', CampaignAnalyticsView.as_view(), name='dashboard-campaigns'),
    path('leads/', LeadAnalyticsView.as_view(), name='dashboard-leads'),
    path('emails/', EmailAnalyticsView.as_view(), name='dashboard-emails'),
]
