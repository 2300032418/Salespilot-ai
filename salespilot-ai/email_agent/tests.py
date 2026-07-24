from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from sales.models import Campaign
from leads.models import Lead
from email_agent.models import EmailDraft


class EmailDraftAPITests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(
            name="Tech Campaign",
            description="Testing email drafts",
            status="active"
        )
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Acme Corp",
            website="https://acme.example.com",
            industry="Software",
            country="USA",
            employee_count=50,
            contact_name="Alice Smith",
            contact_email="alice@acme.example.com",
            lead_score=85,
            status="NEW"
        )
        self.draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Initial Partnership Outreach",
            body="Hello Alice, we would love to collaborate.",
            tone="Professional",
            status="DRAFT",
            approved=False
        )
        self.list_url = reverse('emaildraft-list')
        self.detail_url = reverse('emaildraft-detail', kwargs={'pk': self.draft.pk})

    def test_list_email_drafts(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('lead', response.data[0])
        self.assertEqual(response.data[0]['lead']['company_name'], "Acme Corp")

    def test_retrieve_email_draft(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], "Initial Partnership Outreach")
        self.assertEqual(response.data['lead']['id'], self.lead.id)
        self.assertEqual(response.data['lead']['contact_name'], "Alice Smith")
        self.assertEqual(response.data['lead']['contact_email'], "alice@acme.example.com")

    def test_create_email_draft(self):
        payload = {
            "lead_id": self.lead.id,
            "subject": "Software Development Partnership",
            "body": "Hello Alice, introducing our solution...",
            "tone": "Professional",
            "status": "DRAFT",
            "approved": False
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['subject'], "Software Development Partnership")
        self.assertEqual(response.data['lead']['id'], self.lead.id)
        self.assertEqual(response.data['lead']['company_name'], "Acme Corp")
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_update_email_draft(self):
        payload = {
            "lead_id": self.lead.id,
            "subject": "Updated Subject Line",
            "body": "Updated body content.",
            "tone": "Friendly",
            "status": "APPROVED",
            "approved": True
        }
        response = self.client.put(self.detail_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], "Updated Subject Line")
        self.assertEqual(response.data['tone'], "Friendly")
        self.assertEqual(response.data['status'], "APPROVED")
        self.assertTrue(response.data['approved'])

    def test_partial_update_email_draft(self):
        payload = {"status": "APPROVED", "approved": True}
        response = self.client.patch(self.detail_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], "APPROVED")
        self.assertTrue(response.data['approved'])

    def test_delete_email_draft(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(EmailDraft.objects.filter(pk=self.draft.pk).exists())

    def test_validation_empty_subject_and_body(self):
        payload = {
            "lead_id": self.lead.id,
            "subject": "   ",
            "body": "",
            "tone": "Professional",
            "status": "DRAFT"
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('subject', response.data)
        self.assertIn('body', response.data)

    def test_validation_invalid_tone_and_status(self):
        payload = {
            "lead_id": self.lead.id,
            "subject": "Test",
            "body": "Test body",
            "tone": "Angry",
            "status": "UNKNOWN"
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tone', response.data)
        self.assertIn('status', response.data)


from django.test import SimpleTestCase
from email_agent.services.prompt_builder import build_email_prompt


class PromptBuilderTests(SimpleTestCase):

    class MockLead:
        def __init__(self, company_name, industry, country, contact_name):
            self.company_name = company_name
            self.industry = industry
            self.country = country
            self.contact_name = contact_name

    def test_build_email_prompt_with_valid_lead(self):
        lead = self.MockLead(
            company_name="Langflow",
            industry="Software Development",
            country="USA",
            contact_name="Rodrigo"
        )
        prompt = build_email_prompt(lead)

        self.assertIn("Company:\nLangflow", prompt)
        self.assertIn("Industry:\nSoftware Development", prompt)
        self.assertIn("Country:\nUSA", prompt)
        self.assertIn("Contact:\nRodrigo", prompt)
        self.assertIn("Friendly tone", prompt)
        self.assertIn("Maximum 180 words", prompt)
        self.assertIn("Do not use placeholders.", prompt)

    def test_build_email_prompt_custom_tone_and_words(self):
        lead = self.MockLead(
            company_name="Acme Corp",
            industry="Finance",
            country="UK",
            contact_name="Bob"
        )
        prompt = build_email_prompt(lead, tone="Formal", max_words=150)

        self.assertIn("Company:\nAcme Corp", prompt)
        self.assertIn("Formal tone", prompt)
        self.assertIn("Maximum 150 words", prompt)

    def test_build_email_prompt_none_raises_error(self):
        with self.assertRaises(ValueError):
            build_email_prompt(None)


from unittest.mock import patch, MagicMock
import requests
from email_agent.services.openrouter_client import OpenRouterClient, OpenRouterAPIError


class OpenRouterClientTests(SimpleTestCase):

    def test_generate_email_success(self):
        client = OpenRouterClient(api_key="test_key")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Subject: Partnership\n\nHello Rodrigo, Acme software development services..."
                    }
                }
            ]
        }

        with patch("requests.post", return_value=mock_response) as mock_post:
            result = client.generate_email("Write an email prompt")
            self.assertEqual(result, "Subject: Partnership\n\nHello Rodrigo, Acme software development services...")
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            self.assertEqual(args[0], "https://openrouter.ai/api/v1/chat/completions")
            self.assertEqual(kwargs['headers']['Authorization'], "Bearer test_key")

    def test_generate_email_missing_api_key(self):
        client = OpenRouterClient(api_key="")
        with self.assertRaises(OpenRouterAPIError) as ctx:
            client.generate_email("Some prompt")
        self.assertIn("OPENROUTER_API_KEY is missing", str(ctx.exception))

    def test_generate_email_empty_prompt(self):
        client = OpenRouterClient(api_key="test_key")
        with self.assertRaises(ValueError) as ctx:
            client.generate_email("   ")
        self.assertIn("Prompt cannot be empty", str(ctx.exception))

    def test_generate_email_network_error(self):
        client = OpenRouterClient(api_key="test_key")
        with patch("requests.post", side_effect=requests.RequestException("Connection refused")):
            with self.assertRaises(OpenRouterAPIError) as ctx:
                client.generate_email("Test prompt")
            self.assertIn("Network error while connecting to OpenRouter API", str(ctx.exception))

    def test_generate_email_timeout(self):
        client = OpenRouterClient(api_key="test_key")
        with patch("requests.post", side_effect=requests.Timeout("Timed out")):
            with self.assertRaises(OpenRouterAPIError) as ctx:
                client.generate_email("Test prompt")
            self.assertIn("timed out", str(ctx.exception))

    def test_generate_email_api_error_status(self):
        client = OpenRouterClient(api_key="test_key")
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": {"message": "Invalid API Key"}}

        with patch("requests.post", return_value=mock_response):
            with self.assertRaises(OpenRouterAPIError) as ctx:
                client.generate_email("Test prompt")
            self.assertIn("Invalid OpenRouter API Key (HTTP 401)", str(ctx.exception))


    def test_generate_email_empty_response(self):
        client = OpenRouterClient(api_key="test_key")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"choices": []}

        with patch("requests.post", return_value=mock_response):
            with self.assertRaises(OpenRouterAPIError) as ctx:
                client.generate_email("Test prompt")
            self.assertIn("returned an empty response with no choices", str(ctx.exception))


from email_agent.services.email_generator import EmailGenerator, EmailGenerationError


class EmailGeneratorTests(SimpleTestCase):

    class MockLead:
        def __init__(self, company_name, industry, country, contact_name):
            self.company_name = company_name
            self.industry = industry
            self.country = country
            self.contact_name = contact_name

    def test_email_generator_workflow_success(self):
        mock_client = MagicMock(spec=OpenRouterClient)
        mock_client.generate_email.return_value = "Hello Rodrigo,\n\nI noticed Langflow in Software Development..."

        generator = EmailGenerator(client=mock_client)
        lead = self.MockLead(
            company_name="Langflow",
            industry="Software Development",
            country="USA",
            contact_name="Rodrigo"
        )

        email_text = generator.generate_email(lead)

        self.assertEqual(email_text, "Hello Rodrigo,\n\nI noticed Langflow in Software Development...")
        mock_client.generate_email.assert_called_once()
        prompt_arg = mock_client.generate_email.call_args[0][0]
        self.assertIn("Company:\nLangflow", prompt_arg)

    def test_email_generator_none_lead_raises_error(self):
        generator = EmailGenerator(client=MagicMock(spec=OpenRouterClient))
        with self.assertRaises(EmailGenerationError) as ctx:
            generator.generate_email(None)
        self.assertIn("Lead object cannot be None", str(ctx.exception))

    def test_email_generator_api_error_raises_email_generation_error(self):
        mock_client = MagicMock(spec=OpenRouterClient)
        mock_client.generate_email.side_effect = OpenRouterAPIError("API Connection Failed")

        generator = EmailGenerator(client=mock_client)
        lead = self.MockLead(
            company_name="Langflow",
            industry="Software Development",
            country="USA",
            contact_name="Rodrigo"
        )

        with self.assertRaises(EmailGenerationError) as ctx:
            generator.generate_email(lead)
        self.assertIn("Email generation failed due to API error", str(ctx.exception))


class EmailGenerateAPITests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(
            name="AI Campaign",
            description="Testing AI Email Generation",
            status="active"
        )
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Langflow",
            website="https://langflow.org",
            industry="Software Development",
            country="USA",
            employee_count=15,
            contact_name="Rodrigo",
            contact_email="rodrigo@langflow.org",
            lead_score=88,
            status="NEW"
        )
        self.generate_url = reverse('emaildraft-generate')

    @patch.object(EmailGenerator, 'generate_email')
    def test_generate_api_success(self, mock_generate):
        mock_generate.return_value = "Subject: Software Development Partnership\n\nHello Rodrigo,\n\nI noticed Langflow in Software Development..."

        payload = {"lead_id": self.lead.id, "tone": "Friendly"}
        response = self.client.post(self.generate_url, data=payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['subject'], "Software Development Partnership")
        self.assertIn("Hello Rodrigo", response.data['body'])
        self.assertEqual(response.data['tone'], "Friendly")
        self.assertEqual(response.data['status'], "DRAFT")
        self.assertFalse(response.data['approved'])
        self.assertEqual(response.data['lead']['id'], self.lead.id)
        self.assertEqual(response.data['lead']['company_name'], "Langflow")

        self.assertTrue(EmailDraft.objects.filter(pk=response.data['id']).exists())

    def test_generate_api_missing_lead_id(self):
        response = self.client.post(self.generate_url, data={}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lead_id', response.data)

    def test_generate_api_lead_not_found(self):
        payload = {"lead_id": 999999}
        response = self.client.post(self.generate_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lead_id', response.data)

    def test_generate_api_invalid_tone(self):
        payload = {"lead_id": self.lead.id, "tone": "InvalidTone"}
        response = self.client.post(self.generate_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tone', response.data)

    @patch.object(EmailGenerator, 'generate_email')
    def test_generate_api_generator_error_500(self, mock_generate):
        mock_generate.side_effect = EmailGenerationError("API Service unavailable")
        payload = {"lead_id": self.lead.id}
        response = self.client.post(self.generate_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("AI Email generation failed", response.data['error'])


class EmailApprovalAPITests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(
            name="Approval Campaign",
            description="Testing Email Approval",
            status="active"
        )
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Approval Corp",
            contact_name="Bob Smith",
            contact_email="bob@approval.example.com"
        )
        self.draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Proposal for Approval Corp",
            body="Hi Bob, review our proposal...",
            tone="Professional",
            status=EmailDraft.Status.DRAFT,
            approved=False
        )
        self.approve_url = reverse('emaildraft-approve', kwargs={'pk': self.draft.pk})
        self.reject_url = reverse('emaildraft-reject', kwargs={'pk': self.draft.pk})

    def test_approve_email_draft_success(self):
        response = self.client.post(self.approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['approved'])
        self.assertEqual(response.data['status'], 'APPROVED')

        self.draft.refresh_from_db()
        self.assertTrue(self.draft.approved)
        self.assertEqual(self.draft.status, EmailDraft.Status.APPROVED)

    def test_approve_email_draft_not_found(self):
        url = reverse('emaildraft-approve', kwargs={'pk': 999999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reject_email_draft_success(self):
        response = self.client.post(self.reject_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['approved'])
        self.assertEqual(response.data['status'], 'REJECTED')

        self.draft.refresh_from_db()
        self.assertFalse(self.draft.approved)
        self.assertEqual(self.draft.status, EmailDraft.Status.REJECTED)

    def test_reject_email_draft_not_found(self):
        url = reverse('emaildraft-reject', kwargs={'pk': 999999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


import socket
import smtplib
from django.core import mail
from email_agent.services.email_sender import EmailSender, EmailSendingError


class EmailSenderServiceTests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(
            name="Email Sender Campaign",
            description="Testing EmailSender service",
            status="active"
        )
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Acme Inc",
            contact_name="Alice Johnson",
            contact_email="alice@acme.example.com"
        )
        self.approved_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Approved Outreach Subject",
            body="Hello Alice, here is your outreach email.",
            tone="Professional",
            status=EmailDraft.Status.APPROVED,
            approved=True
        )
        self.unapproved_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Unapproved Outreach Subject",
            body="Draft content awaiting review...",
            tone="Professional",
            status=EmailDraft.Status.DRAFT,
            approved=False
        )

    def test_send_email_success(self):
        sender = EmailSender()
        initial_updated_at = self.approved_draft.updated_at

        result = sender.send_email(self.approved_draft)

        self.assertEqual(result['message'], "Email sent successfully")
        self.assertEqual(result['recipient'], "alice@acme.example.com")
        self.assertEqual(result['status'], EmailDraft.Status.SENT)

        # Check outbox mail count and headers
        self.assertEqual(len(mail.outbox), 1)
        sent_msg = mail.outbox[0]
        self.assertEqual(sent_msg.subject, "Approved Outreach Subject")
        self.assertEqual(sent_msg.body, "Hello Alice, here is your outreach email.")
        self.assertEqual(sent_msg.to, ["alice@acme.example.com"])

        # Check database update
        self.approved_draft.refresh_from_db()
        self.assertEqual(self.approved_draft.status, EmailDraft.Status.SENT)
        self.assertGreaterEqual(self.approved_draft.updated_at, initial_updated_at)

    def test_send_email_none_draft_raises_error(self):
        sender = EmailSender()
        with self.assertRaises(ValueError) as ctx:
            sender.send_email(None)
        self.assertIn("Email draft object cannot be None", str(ctx.exception))

    def test_send_email_unapproved_draft_raises_error(self):
        sender = EmailSender()
        with self.assertRaises(ValueError) as ctx:
            sender.send_email(self.unapproved_draft)
        self.assertIn("Draft is not approved for sending", str(ctx.exception))

    def test_send_email_already_sent_draft_raises_error(self):
        self.approved_draft.status = EmailDraft.Status.SENT
        self.approved_draft.save()

        sender = EmailSender()
        with self.assertRaises(ValueError) as ctx:
            sender.send_email(self.approved_draft)
        self.assertIn("Email draft has already been sent", str(ctx.exception))

    @patch("email_agent.services.email_sender.send_mail", side_effect=smtplib.SMTPException("SMTP Auth Failed"))
    def test_send_email_smtp_error(self, mock_send_mail):
        sender = EmailSender()
        with self.assertRaises(EmailSendingError) as ctx:
            sender.send_email(self.approved_draft)
        self.assertIn("SMTP error while sending email", str(ctx.exception))

    @patch("email_agent.services.email_sender.send_mail", side_effect=socket.error("Network host unreachable"))
    def test_send_email_network_error(self, mock_send_mail):
        sender = EmailSender()
        with self.assertRaises(EmailSendingError) as ctx:
            sender.send_email(self.approved_draft)
        self.assertIn("Network error while sending email", str(ctx.exception))


class EmailSendAPITests(APITestCase):

    def setUp(self):
        self.campaign = Campaign.objects.create(
            name="Send API Campaign",
            description="Testing Email Send API",
            status="active"
        )
        self.lead = Lead.objects.create(
            campaign=self.campaign,
            company_name="Globex",
            contact_name="Charlie Brown",
            contact_email="charlie@globex.example.com"
        )
        self.approved_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Proposal for Globex",
            body="Hi Charlie, please check our proposal.",
            tone="Professional",
            status=EmailDraft.Status.APPROVED,
            approved=True
        )
        self.unapproved_draft = EmailDraft.objects.create(
            lead=self.lead,
            subject="Draft Proposal",
            body="Hi Charlie...",
            tone="Casual",
            status=EmailDraft.Status.DRAFT,
            approved=False
        )
        self.send_approved_url = reverse('emaildraft-send-email', kwargs={'pk': self.approved_draft.pk})
        self.send_unapproved_url = reverse('emaildraft-send-email', kwargs={'pk': self.unapproved_draft.pk})

    def test_send_api_success(self):
        response = self.client.post(self.send_approved_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Email sent successfully")
        self.assertEqual(response.data['recipient'], "charlie@globex.example.com")
        self.assertEqual(response.data['status'], "SENT")

        self.approved_draft.refresh_from_db()
        self.assertEqual(self.approved_draft.status, EmailDraft.Status.SENT)

    def test_send_api_unapproved_draft_returns_400(self):
        response = self.client.post(self.send_unapproved_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Draft is not approved for sending", response.data['error'])

    def test_send_api_not_found(self):
        url = reverse('emaildraft-send-email', kwargs={'pk': 999999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch.object(EmailSender, 'send_email', side_effect=EmailSendingError("SMTP server down"))
    def test_send_api_sending_error_returns_500(self, mock_send):
        response = self.client.post(self.send_approved_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("SMTP server down", response.data['error'])







