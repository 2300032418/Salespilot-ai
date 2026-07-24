from django.db import models
from leads.models import Lead


class EmailDraft(models.Model):
    """
    Stores an AI-generated (or manually written) email draft for a Lead.

    Relationship:
        - EmailDraft → Lead (ForeignKey, many-to-one)
          One Lead can have multiple email drafts (different tones, retries, etc.)
          Each EmailDraft belongs to exactly one Lead.
    """

    # ------------------------------------------------------------------
    # Choices
    # ------------------------------------------------------------------

    class Tone(models.TextChoices):
        PROFESSIONAL = 'Professional', 'Professional'
        FRIENDLY     = 'Friendly',     'Friendly'
        FORMAL       = 'Formal',       'Formal'
        CASUAL       = 'Casual',       'Casual'

    class Status(models.TextChoices):
        DRAFT    = 'DRAFT',    'Draft'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        SENT     = 'SENT',     'Sent'


    # ------------------------------------------------------------------
    # Fields
    # ------------------------------------------------------------------

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='email_drafts',
        help_text='The lead this email draft is targeting.',
    )

    subject = models.CharField(
        max_length=255,
        help_text='Email subject line.',
    )

    body = models.TextField(
        help_text='Full email body content.',
    )

    tone = models.CharField(
        max_length=20,
        choices=Tone.choices,
        default=Tone.PROFESSIONAL,
        help_text='Tone used when generating this email.',
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT,
        help_text='Current status of this email draft.',
    )

    approved = models.BooleanField(
        default=False,
        help_text='Whether this draft has been approved for sending.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ------------------------------------------------------------------
    # Meta & string representation
    # ------------------------------------------------------------------

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Draft'
        verbose_name_plural = 'Email Drafts'

    def __str__(self):
        return f"[{self.status}] {self.subject} → {self.lead.company_name}"
