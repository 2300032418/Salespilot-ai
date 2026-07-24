"""
OpenRouter API Client Service for Email Agent.

Provides a reusable integration for generating email content via the
OpenRouter Chat Completions API.
"""

import os
import requests
from dotenv import load_dotenv

from django.conf import settings

load_dotenv()


class OpenRouterAPIError(Exception):
    """Custom exception raised when an OpenRouter API error occurs."""
    pass


class OpenRouterClient:
    """
    Reusable client for OpenRouter Chat Completions API.
    """

    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    DEFAULT_MODEL = "openai/gpt-4.1-mini"

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initializes the OpenRouter client.

        Args:
            api_key (str, optional): API key for OpenRouter. Defaults to settings.OPENROUTER_API_KEY or env var.
            model (str, optional): Model identifier. Defaults to openai/gpt-4.1-mini.
        """
        if api_key is not None:
            self.api_key = api_key
        else:
            self.api_key = getattr(settings, 'OPENROUTER_API_KEY', None) or os.getenv('OPENROUTER_API_KEY')
        self.model = model or self.DEFAULT_MODEL

    def generate_email(self, prompt: str) -> str:
        """
        Sends a prompt to OpenRouter API and returns the generated email text.

        Args:
            prompt (str): Prompt string describing the email requirements.

        Returns:
            str: Generated email content.

        Raises:
            ValueError: If prompt is empty or invalid.
            OpenRouterAPIError: If API key is missing, network request fails, timeout occurs,
                                API returns error response, or content is empty.
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        if not self.api_key:
            raise OpenRouterAPIError("OPENROUTER_API_KEY is missing or unconfigured in settings/environment.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": 500,
            "temperature": 0.7,
        }

        try:
            response = requests.post(
                self.OPENROUTER_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
        except requests.Timeout as e:
            raise OpenRouterAPIError(f"OpenRouter API request timed out: {str(e)}") from e
        except requests.RequestException as e:
            raise OpenRouterAPIError(f"Network error while connecting to OpenRouter API: {str(e)}") from e

        if response.status_code != 200:
            try:
                err_data = response.json()
                err_msg = err_data.get('error', {}).get('message', response.text)
            except Exception:
                err_msg = response.text
            if response.status_code == 401:
                raise OpenRouterAPIError(f"Invalid OpenRouter API Key (HTTP 401): {err_msg}")
            raise OpenRouterAPIError(f"OpenRouter API error (HTTP {response.status_code}): {err_msg}")

        try:
            data = response.json()
            choices = data.get('choices', [])
            if not choices:
                raise OpenRouterAPIError("OpenRouter API returned an empty response with no choices.")

            message = choices[0].get('message', {})
            content = message.get('content', '')
            if not content or not content.strip():
                raise OpenRouterAPIError("OpenRouter API returned empty message content.")

            return content.strip()
        except (ValueError, KeyError, TypeError) as e:
            if isinstance(e, OpenRouterAPIError):
                raise
            raise OpenRouterAPIError(f"Failed to parse OpenRouter API response: {str(e)}") from e

