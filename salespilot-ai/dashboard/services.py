"""
Dashboard Service Layer for SalesPilot AI.

Provides optimized business analytics, ORM aggregations, searching,
filtering, and pagination helpers across Campaigns, ICPs, Leads, and Email Drafts.
"""

import logging
from django.db.models import Count, Q
from rest_framework.pagination import PageNumberPagination

from sales.models import Campaign, ICP
from leads.models import Lead
from email_agent.models import EmailDraft

logger = logging.getLogger(__name__)


class DashboardPagination(PageNumberPagination):
    """Standard page-number pagination class for dashboard lists."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DashboardService:
    """
    Service responsible for aggregating and compiling system-wide analytics.
    Follows SOLID principles and utilizes optimized single-query Django ORM operations.
    """

    @staticmethod
    def get_dashboard_stats() -> dict:
        """
        Calculates high-level system metrics for main dashboard overview.

        Returns:
            dict: Summary metrics for campaigns, ICPs, leads, and emails.
        """
        # 1. Campaign summary metrics
        campaign_stats = Campaign.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status__iexact='active')),
        )
        total_campaigns = campaign_stats['total'] or 0
        active_campaigns = campaign_stats['active'] or 0
        inactive_campaigns = total_campaigns - active_campaigns

        # 2. ICP and Lead summary counts
        total_icps = ICP.objects.count()
        total_leads = Lead.objects.count()

        # 3. Email Draft status breakdown
        email_stats = EmailDraft.objects.aggregate(
            draft=Count('id', filter=Q(status=EmailDraft.Status.DRAFT)),
            approved=Count('id', filter=Q(status=EmailDraft.Status.APPROVED)),
            rejected=Count('id', filter=Q(status=EmailDraft.Status.REJECTED)),
            sent=Count('id', filter=Q(status=EmailDraft.Status.SENT)),
            total=Count('id'),
        )

        return {
            "campaigns": {
                "total": total_campaigns,
                "active": active_campaigns,
                "inactive": inactive_campaigns,
            },
            "icps": {
                "total": total_icps,
            },
            "leads": {
                "total": total_leads,
            },
            "emails": {
                "draft": email_stats['draft'] or 0,
                "approved": email_stats['approved'] or 0,
                "rejected": email_stats['rejected'] or 0,
                "sent": email_stats['sent'] or 0,
                "total": email_stats['total'] or 0,
            },
        }

    @staticmethod
    def get_campaign_analytics(search: str = None, status: str = None) -> list[dict]:
        """
        Computes detailed analytics for every campaign using single annotated ORM query.

        Args:
            search (str, optional): Search filter for campaign name.
            status (str, optional): Filter by campaign status (active/inactive/draft).

        Returns:
            list[dict]: Array of campaign analytics dicts.
        """
        queryset = Campaign.objects.all()

        # Apply search filter across Campaign Name
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Apply filter for Campaign Status
        if status:
            queryset = queryset.filter(status__iexact=status)

        # Single annotated ORM query to prevent N+1 query overhead
        annotated_queryset = queryset.annotate(
            total_leads=Count('leads', distinct=True),
            emails_generated=Count('leads__email_drafts', distinct=True),
            approved_count=Count('leads__email_drafts', filter=Q(leads__email_drafts__status=EmailDraft.Status.APPROVED), distinct=True),
            rejected_count=Count('leads__email_drafts', filter=Q(leads__email_drafts__status=EmailDraft.Status.REJECTED), distinct=True),
            sent_count=Count('leads__email_drafts', filter=Q(leads__email_drafts__status=EmailDraft.Status.SENT), distinct=True),
        ).order_by('id')

        results = []
        for campaign in annotated_queryset:
            results.append({
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "total_leads": campaign.total_leads,
                "emails_generated": campaign.emails_generated,
                "approved": campaign.approved_count,
                "rejected": campaign.rejected_count,
                "sent": campaign.sent_count,
            })

        return results

    @staticmethod
    def get_lead_analytics(search: str = None, company: str = None) -> dict:
        """
        Computes lead counts, distinct company count, and distinct country count.

        Args:
            search (str, optional): Search across company, contact name, or campaign name.
            company (str, optional): Filter by Lead Company.

        Returns:
            dict: Summary lead analytics metrics.
        """
        queryset = Lead.objects.all()

        # Search across Lead Company, Contact Name, and Campaign Name
        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search) |
                Q(contact_name__icontains=search) |
                Q(campaign__name__icontains=search)
            )

        # Filter by Lead Company
        if company:
            queryset = queryset.filter(company_name__iexact=company)

        total_leads = queryset.count()
        distinct_companies = queryset.values('company_name').distinct().count()
        distinct_countries = (
            queryset.exclude(Q(country__isnull=True) | Q(country=''))
            .values('country')
            .distinct()
            .count()
        )

        return {
            "total_leads": total_leads,
            "companies": distinct_companies,
            "countries": distinct_countries,
        }

    @staticmethod
    def get_email_analytics(search: str = None, status: str = None, company: str = None) -> dict:
        """
        Computes draft, approved, rejected, sent counts and calculated approval & rejection rates.

        Approval Rate = approved / (approved + rejected) * 100

        Args:
            search (str, optional): Search across Email Subject, Lead Contact, Lead Company, or Campaign.
            status (str, optional): Filter by Email Status (DRAFT, APPROVED, REJECTED, SENT).
            company (str, optional): Filter by Lead Company.

        Returns:
            dict: Email analytics metrics.
        """
        queryset = EmailDraft.objects.all()

        # Search across Email Subject, Contact Name, Company Name, Campaign Name
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(lead__contact_name__icontains=search) |
                Q(lead__company_name__icontains=search) |
                Q(lead__campaign__name__icontains=search)
            )

        # Filter by Email Status
        if status:
            queryset = queryset.filter(status__iexact=status)

        # Filter by Lead Company
        if company:
            queryset = queryset.filter(lead__company_name__iexact=company)

        stats = queryset.aggregate(
            draft=Count('id', filter=Q(status=EmailDraft.Status.DRAFT)),
            approved=Count('id', filter=Q(status=EmailDraft.Status.APPROVED)),
            rejected=Count('id', filter=Q(status=EmailDraft.Status.REJECTED)),
            sent=Count('id', filter=Q(status=EmailDraft.Status.SENT)),
        )

        draft_cnt = stats['draft'] or 0
        approved_cnt = stats['approved'] or 0
        rejected_cnt = stats['rejected'] or 0
        sent_cnt = stats['sent'] or 0

        total_reviewed = approved_cnt + rejected_cnt

        if total_reviewed > 0:
            approval_rate = round((approved_cnt / total_reviewed) * 100, 2)
            rejection_rate = round((rejected_cnt / total_reviewed) * 100, 2)
        else:
            approval_rate = 0.0
            rejection_rate = 0.0

        return {
            "draft": draft_cnt,
            "approved": approved_cnt,
            "rejected": rejected_cnt,
            "sent": sent_cnt,
            "approval_rate": approval_rate,
            "rejection_rate": rejection_rate,
        }
