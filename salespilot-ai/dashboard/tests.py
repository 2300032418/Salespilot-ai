"""
Unit Tests for SalesPilot AI Dashboard & Analytics Module.
"""

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from sales.models import Campaign, ICP
from leads.models import Lead
from email_agent.models import EmailDraft


class DashboardAPITests(APITestCase):

    def setUp(self):
        # Create Campaign 1
        self.campaign1 = Campaign.objects.create(
            name="AI Tech Outreach",
            description="Testing dashboard campaign 1",
            status="active"
        )
        self.icp1 = ICP.objects.create(
            campaign=self.campaign1,
            industry="Software Development",
            company_size="10-50",
            keywords="AI, LLM, Python"
        )
        self.lead1 = Lead.objects.create(
            campaign=self.campaign1,
            company_name="Langflow",
            contact_name="Rodrigo",
            contact_email="rodrigo@langflow.org",
            country="USA",
            status="NEW"
        )
        self.lead2 = Lead.objects.create(
            campaign=self.campaign1,
            company_name="CrewAI",
            contact_name="Joao",
            contact_email="joao@crewai.com",
            country="USA",
            status="QUALIFIED"
        )

        # Create EmailDrafts for Campaign 1
        self.draft1 = EmailDraft.objects.create(
            lead=self.lead1,
            subject="Outreach to Langflow",
            body="Hello Rodrigo...",
            status=EmailDraft.Status.SENT,
            approved=True
        )
        self.draft2 = EmailDraft.objects.create(
            lead=self.lead2,
            subject="Outreach to CrewAI",
            body="Hello Joao...",
            status=EmailDraft.Status.APPROVED,
            approved=True
        )
        self.draft3 = EmailDraft.objects.create(
            lead=self.lead2,
            subject="Followup to CrewAI",
            body="Hi Joao following up...",
            status=EmailDraft.Status.REJECTED,
            approved=False
        )

        # Create Campaign 2
        self.campaign2 = Campaign.objects.create(
            name="Finance Outreach",
            description="Testing dashboard campaign 2",
            status="inactive"
        )
        self.lead3 = Lead.objects.create(
            campaign=self.campaign2,
            company_name="Stripe",
            contact_name="Patrick",
            contact_email="patrick@stripe.com",
            country="Ireland",
            status="NEW"
        )
        self.draft4 = EmailDraft.objects.create(
            lead=self.lead3,
            subject="Partnership with Stripe",
            body="Hi Patrick...",
            status=EmailDraft.Status.DRAFT,
            approved=False
        )

        self.dashboard_url = reverse('dashboard-overview')
        self.campaigns_url = reverse('dashboard-campaigns')
        self.leads_url = reverse('dashboard-leads')
        self.emails_url = reverse('dashboard-emails')

    def test_dashboard_overview_stats(self):
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['campaigns']['total'], 2)
        self.assertEqual(data['campaigns']['active'], 1)
        self.assertEqual(data['campaigns']['inactive'], 1)

        self.assertEqual(data['icps']['total'], 1)
        self.assertEqual(data['leads']['total'], 3)

        self.assertEqual(data['emails']['draft'], 1)
        self.assertEqual(data['emails']['approved'], 1)
        self.assertEqual(data['emails']['rejected'], 1)
        self.assertEqual(data['emails']['sent'], 1)
        self.assertEqual(data['emails']['total'], 4)

    def test_campaign_analytics(self):
        response = self.client.get(self.campaigns_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        c1_data = next(c for c in response.data if c['campaign_id'] == self.campaign1.id)
        self.assertEqual(c1_data['campaign_name'], "AI Tech Outreach")
        self.assertEqual(c1_data['total_leads'], 2)
        self.assertEqual(c1_data['emails_generated'], 3)
        self.assertEqual(c1_data['approved'], 1)
        self.assertEqual(c1_data['rejected'], 1)
        self.assertEqual(c1_data['sent'], 1)

    def test_campaign_analytics_search_and_filter(self):
        # Search by campaign name
        response = self.client.get(self.campaigns_url, {'search': 'Finance'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['campaign_name'], "Finance Outreach")

        # Filter by campaign status
        response = self.client.get(self.campaigns_url, {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['campaign_name'], "AI Tech Outreach")

    def test_campaign_analytics_pagination(self):
        response = self.client.get(self.campaigns_url, {'page': 1, 'page_size': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 1)

    def test_lead_analytics(self):
        response = self.client.get(self.leads_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_leads'], 3)
        self.assertEqual(response.data['companies'], 3)
        self.assertEqual(response.data['countries'], 2)

    def test_lead_analytics_search_and_filter(self):
        response = self.client.get(self.leads_url, {'search': 'Langflow'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_leads'], 1)
        self.assertEqual(response.data['companies'], 1)

    def test_email_analytics(self):
        response = self.client.get(self.emails_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['draft'], 1)
        self.assertEqual(data['approved'], 1)
        self.assertEqual(data['rejected'], 1)
        self.assertEqual(data['sent'], 1)
        self.assertEqual(data['approval_rate'], 50.0)
        self.assertEqual(data['rejection_rate'], 50.0)

    def test_email_analytics_search_and_filter(self):
        response = self.client.get(self.emails_url, {'status': 'APPROVED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['approved'], 1)
        self.assertEqual(response.data['draft'], 0)


class ValidationRuleTests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(name="Validation Campaign")
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Test Co",
            contact_name="Bob",
            contact_email="bob@test.com"
        )
        self.sent_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Sent Email",
            body="Body...",
            status=EmailDraft.Status.SENT,
            approved=True
        )
        self.rejected_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Rejected Email",
            body="Body...",
            status=EmailDraft.Status.REJECTED,
            approved=False
        )

    def test_cannot_approve_after_sent(self):
        url = reverse('emaildraft-approve', kwargs={'pk': self.sent_draft.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been sent", response.data['error'])

    def test_cannot_reject_after_sent(self):
        url = reverse('emaildraft-reject', kwargs={'pk': self.sent_draft.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been sent", response.data['error'])

    def test_cannot_approve_after_rejected(self):
        url = reverse('emaildraft-approve', kwargs={'pk': self.rejected_draft.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("has been rejected", response.data['error'])

    def test_cannot_send_after_rejected(self):
        url = reverse('emaildraft-send-email', kwargs={'pk': self.rejected_draft.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("has been rejected", response.data['error'])
