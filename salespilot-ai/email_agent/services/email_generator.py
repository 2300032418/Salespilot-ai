"""
AI Email Generator Service.

Orchestrates prompt construction and OpenRouter API execution to produce
AI-generated cold outreach emails for leads.
"""

import logging
from .prompt_builder import build_email_prompt
from .openrouter_client import OpenRouterClient, OpenRouterAPIError

logger = logging.getLogger(__name__)


class EmailGenerationError(Exception):
    """Custom exception raised when email generation fails."""
    pass


class EmailGenerator:
    """
    High-level service for generating cold emails for leads.
    """

    def __init__(self, client: OpenRouterClient = None):
        """
        Initializes the EmailGenerator with an OpenRouter client instance.

        Args:
            client (OpenRouterClient, optional): OpenRouter API client instance.
        """
        self.client = client or OpenRouterClient()

    def generate_email(self, lead, tone: str = "Friendly", max_words: int = 180) -> str:
        """
        Generates an AI email for the specified lead.

        Workflow:
        1. Accept a Lead object.
        2. Call build_email_prompt(lead).
        3. Pass prompt to OpenRouterClient.generate_email().
        4. Return the generated email text.

        Args:
            lead: Lead model instance containing lead metadata.
            tone (str, optional): Desired email tone. Defaults to "Friendly".
            max_words (int, optional): Word count constraint. Defaults to 180.

        Returns:
            str: Generated email text string.

        Raises:
            EmailGenerationError: If prompt creation or API call fails.
        """
        if lead is None:
            raise EmailGenerationError("Lead object cannot be None.")

        try:
            # Step 1: Build the prompt using lead details
            prompt = build_email_prompt(lead, tone=tone, max_words=max_words)

            # Step 2: Request email generation from OpenRouter
            email_text = self.client.generate_email(prompt)

            return email_text

        except ValueError as e:
            logger.error(f"Validation error during email generation: {e}")
            raise EmailGenerationError(f"Invalid input for email generation: {e}") from e

        except OpenRouterAPIError as e:
            logger.error(f"OpenRouter API error during email generation: {e}")
            raise EmailGenerationError(f"Email generation failed due to API error: {e}") from e

        except Exception as e:
            logger.error(f"Unexpected error during email generation: {e}")
            raise EmailGenerationError(f"An unexpected error occurred during email generation: {e}") from e
