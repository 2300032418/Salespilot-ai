"""
Email Sender Service for SalesPilot AI.

Responsible for validating approved email drafts and dispatching them to
lead contacts via Django's configured SMTP Email Backend.
"""

import logging
import socket
import smtplib

from django.conf import settings
from django.core.mail import send_mail
from email_agent.models import EmailDraft

logger = logging.getLogger(__name__)


class EmailSendingError(Exception):
    """Custom exception raised when email dispatch fails due to network or SMTP errors."""
    pass


class EmailSender:
    """
    Reusable service for sending approved cold outreach email drafts.
    """

    def send_email(self, email_draft: EmailDraft) -> dict:
        """
        Validates and sends an email draft to the associated lead contact.

        Workflow:
        1. Validate draft existence and type.
        2. Validate draft approval state (must be approved).
        3. Validate draft status (must not already be SENT).
        4. Validate recipient email address.
        5. Send email using django.core.mail.send_mail().
        6. Update draft status to SENT and save (automatically updates updated_at).
        7. Return structured success payload.

        Args:
            email_draft (EmailDraft): The EmailDraft instance to send.

        Returns:
            dict: Success response containing message, recipient, and updated status.

        Raises:
            ValueError: If draft validation fails (missing, unapproved, or already sent).
            EmailSendingError: If SMTP or network error occurs during dispatch.
        """
        # ------------------------------------------------------------------
        # Step 1: Validate draft existence
        # ------------------------------------------------------------------
        if email_draft is None:
            logger.error("Email sending failed: email_draft object is None.")
            raise ValueError("Invalid draft: Email draft object cannot be None.")

        # ------------------------------------------------------------------
        # Step 2: Validate that draft has not already been sent or rejected
        # ------------------------------------------------------------------
        if email_draft.status == EmailDraft.Status.SENT:
            logger.warning(f"Attempted to re-send already sent email draft #{getattr(email_draft, 'id', 'N/A')}.")
            raise ValueError("Email draft has already been sent.")

        if email_draft.status == EmailDraft.Status.REJECTED:
            logger.warning(f"Attempted to send rejected email draft #{getattr(email_draft, 'id', 'N/A')}.")
            raise ValueError("Cannot send email draft that has been rejected.")

        # ------------------------------------------------------------------
        # Step 3: Validate that draft is approved
        # ------------------------------------------------------------------
        if not getattr(email_draft, 'approved', False) or email_draft.status != EmailDraft.Status.APPROVED:
            logger.warning(
                f"Attempted to send unapproved email draft #{getattr(email_draft, 'id', 'N/A')}. "
                f"Approved: {getattr(email_draft, 'approved', False)}, Status: '{getattr(email_draft, 'status', 'N/A')}'."
            )
            raise ValueError("Draft is not approved for sending. Please approve the draft first.")

        # ------------------------------------------------------------------
        # Step 4: Validate recipient email availability
        # ------------------------------------------------------------------
        if not hasattr(email_draft, 'lead') or not email_draft.lead or not email_draft.lead.contact_email:
            logger.error(f"Email draft #{email_draft.id} is missing a valid lead or contact email.")
            raise ValueError("Invalid lead contact: Recipient email address is missing.")

        recipient_email = email_draft.lead.contact_email

        # ------------------------------------------------------------------
        # Step 5: Prepare subject, body, and sender address
        # ------------------------------------------------------------------
        subject = email_draft.subject
        body = email_draft.body
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@salespilot.ai')

        # ------------------------------------------------------------------
        # Step 6: Dispatch email using django.core.mail.send_mail
        # ------------------------------------------------------------------
        try:
            logger.info(f"Sending email draft #{email_draft.id} to '{recipient_email}'...")
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=[recipient_email],
                fail_silently=False,
            )

        except smtplib.SMTPException as e:
            # Handle SMTP server protocol, authentication, or transport errors
            logger.error(f"SMTP error while sending email draft #{email_draft.id}: {e}")
            raise EmailSendingError(f"SMTP error while sending email: {e}") from e

        except (socket.error, OSError, ConnectionError) as e:
            # Handle network connectivity, host resolution, or socket timeouts
            logger.error(f"Network error while sending email draft #{email_draft.id}: {e}")
            raise EmailSendingError(f"Network error while sending email: {e}") from e

        except Exception as e:
            # Handle any other unexpected transport errors
            logger.error(f"Unexpected error while sending email draft #{email_draft.id}: {e}")
            raise EmailSendingError(f"Failed to send email due to an unexpected error: {e}") from e

        # ------------------------------------------------------------------
        # Step 7: Update draft status to SENT and save (updated_at updates auto)
        # ------------------------------------------------------------------
        email_draft.status = EmailDraft.Status.SENT
        email_draft.save()
        logger.info(f"Email draft #{email_draft.id} status updated to SENT.")

        # ------------------------------------------------------------------
        # Step 8: Return structured response
        # ------------------------------------------------------------------
        return {
            "message": "Email sent successfully",
            "recipient": recipient_email,
            "status": EmailDraft.Status.SENT
        }
