"""
Serializers for SalesPilot AI Dashboard & Analytics Module.
"""

from rest_framework import serializers


class CampaignCountStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    inactive = serializers.IntegerField()


class ICPCountStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()


class LeadCountStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()


class EmailCountStatsSerializer(serializers.Serializer):
    draft = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    sent = serializers.IntegerField()
    total = serializers.IntegerField()


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for GET /api/dashboard/ response."""
    campaigns = CampaignCountStatsSerializer()
    icps = ICPCountStatsSerializer()
    leads = LeadCountStatsSerializer()
    emails = EmailCountStatsSerializer()


class CampaignAnalyticsSerializer(serializers.Serializer):
    """Serializer for items in GET /api/dashboard/campaigns/ response."""
    campaign_id = serializers.IntegerField()
    campaign_name = serializers.CharField()
    total_leads = serializers.IntegerField()
    emails_generated = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    sent = serializers.IntegerField()


class LeadAnalyticsSerializer(serializers.Serializer):
    """Serializer for GET /api/dashboard/leads/ response."""
    total_leads = serializers.IntegerField()
    companies = serializers.IntegerField()
    countries = serializers.IntegerField()


class EmailAnalyticsSerializer(serializers.Serializer):
    """Serializer for GET /api/dashboard/emails/ response."""
    draft = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    sent = serializers.IntegerField()
    approval_rate = serializers.FloatField()
    rejection_rate = serializers.FloatField()
