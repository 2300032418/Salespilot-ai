from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmailDraft
from .serializers import EmailDraftSerializer, GenerateEmailSerializer
from leads.models import Lead
from .services.email_generator import EmailGenerator, EmailGenerationError
from .services.email_sender import EmailSender, EmailSendingError


def parse_email_response(generated_text: str, default_company: str = "") -> tuple[str, str]:
    """
    Parses generated email text into (subject, body).

    Looks for 'Subject:' header at the beginning of the text.
    If present, extracts subject line and remaining body.
    Otherwise, uses fallback subject and full text as body.
    """
    text = generated_text.strip()
    lines = text.splitlines()

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if line_clean.lower().startswith('subject:'):
            subject = line_clean[8:].strip().strip('"\'')
            body_lines = lines[i + 1:]
            body = "\n".join(body_lines).strip()
            return subject, body

    subject = f"Outreach to {default_company}" if default_company else "Cold Outreach Email"
    return subject, text


class EmailDraftViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for managing EmailDraft instances.
    Provides list, create, retrieve, update, partial_update, destroy operations,
    custom AI generation at POST /api/email-drafts/generate/,
    approval/rejection actions, and email sending at POST /api/email-drafts/<id>/send/.
    """
    queryset = EmailDraft.objects.all()
    serializer_class = EmailDraftSerializer

    # ------------------------------------------------------------------
    # Generate AI Email Draft
    # POST /api/email-drafts/generate/
    # ------------------------------------------------------------------
    @action(
        detail=False,
        methods=["post"],
        url_path="generate",
        serializer_class=GenerateEmailSerializer,
    )
    def generate(self, request):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        lead = serializer.validated_data["lead"]
        tone = serializer.validated_data.get(
            "tone",
            EmailDraft.Tone.PROFESSIONAL,
        )

        try:
            generator = EmailGenerator()
            email_text = generator.generate_email(
                lead,
                tone=tone,
            )

        except (EmailGenerationError, Exception) as e:
            return Response(
                {
                    "error": f"AI Email generation failed: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        subject, body = parse_email_response(
            email_text,
            default_company=lead.company_name,
        )

        draft = EmailDraft.objects.create(
            lead=lead,
            subject=subject,
            body=body,
            tone=tone,
            status=EmailDraft.Status.DRAFT,
            approved=False,
        )

        return Response(
            EmailDraftSerializer(
                draft,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # Approve Draft
    # POST /api/email-drafts/<id>/approve/
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        draft = self.get_object()

        if draft.status == EmailDraft.Status.SENT:
            return Response(
                {"error": "Cannot approve email draft that has already been sent."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if draft.status == EmailDraft.Status.REJECTED:
            return Response(
                {"error": "Cannot approve email draft that has been rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        draft.approved = True
        draft.status = EmailDraft.Status.APPROVED
        draft.save()

        return Response(
            EmailDraftSerializer(
                draft,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # Reject Draft
    # POST /api/email-drafts/<id>/reject/
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        draft = self.get_object()

        if draft.status == EmailDraft.Status.SENT:
            return Response(
                {"error": "Cannot reject email draft that has already been sent."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        draft.approved = False
        draft.status = EmailDraft.Status.REJECTED
        draft.save()

        return Response(
            EmailDraftSerializer(
                draft,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # Send Approved Draft
    # POST /api/email-drafts/<id>/send/
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="send")
    def send_email(self, request, pk=None):
        draft = self.get_object()

        sender = EmailSender()

        try:
            result = sender.send_email(draft)
            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except EmailSendingError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )