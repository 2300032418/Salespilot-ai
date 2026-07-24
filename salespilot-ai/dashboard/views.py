"""
API Views for SalesPilot AI Dashboard & Analytics Module.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .services import DashboardService, DashboardPagination
from .serializers import (
    DashboardStatsSerializer,
    CampaignAnalyticsSerializer,
    LeadAnalyticsSerializer,
    EmailAnalyticsSerializer,
)


class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/
    Returns business statistics across Campaigns, ICPs, Leads, and Email Drafts.
    """

    def get(self, request, *args, **kwargs):
        stats = DashboardService.get_dashboard_stats()
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CampaignAnalyticsView(APIView):
    """
    GET /api/dashboard/campaigns/
    Returns analytics for every campaign.
    Supports query parameters:
      - search: Filter by Campaign Name
      - status: Filter by Campaign Status (active/inactive/draft)
      - page: Page number for paginated results
      - page_size: Results per page
    """

    def get(self, request, *args, **kwargs):
        search = request.query_params.get('search', None)
        campaign_status = request.query_params.get('status', None)

        analytics_data = DashboardService.get_campaign_analytics(
            search=search,
            status=campaign_status,
        )

        # Check if pagination is explicitly requested via query params
        if 'page' in request.query_params:
            paginator = DashboardPagination()
            page = paginator.paginate_queryset(analytics_data, request)
            serializer = CampaignAnalyticsSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = CampaignAnalyticsSerializer(analytics_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LeadAnalyticsView(APIView):
    """
    GET /api/dashboard/leads/
    Returns summary statistics for leads.
    Supports query parameters:
      - search: Search across Company Name, Contact Name, or Campaign Name
      - company: Filter by Lead Company Name
    """

    def get(self, request, *args, **kwargs):
        search = request.query_params.get('search', None)
        company = request.query_params.get('company', None)

        lead_stats = DashboardService.get_lead_analytics(
            search=search,
            company=company,
        )

        serializer = LeadAnalyticsSerializer(lead_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmailAnalyticsView(APIView):
    """
    GET /api/dashboard/emails/
    Returns summary metrics and calculated approval/rejection rates for email drafts.
    Supports query parameters:
      - search: Search across Email Subject, Contact Name, Company Name, or Campaign Name
      - status: Filter by Email Status (DRAFT, APPROVED, REJECTED, SENT)
      - company: Filter by Lead Company Name
    """

    def get(self, request, *args, **kwargs):
        search = request.query_params.get('search', None)
        email_status = request.query_params.get('status', None)
        company = request.query_params.get('company', None)

        email_stats = DashboardService.get_email_analytics(
            search=search,
            status=email_status,
            company=company,
        )

        serializer = EmailAnalyticsSerializer(email_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)
