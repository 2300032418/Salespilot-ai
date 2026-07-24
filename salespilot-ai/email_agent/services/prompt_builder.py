"""
AI Prompt Builder Service for Email Agent.

Constructs structured, professional AI prompts for cold email outreach
based on Lead metadata.
"""


def build_email_prompt(lead, tone: str = "Friendly", max_words: int = 180) -> str:
    """
    Builds a structured B2B cold outreach email prompt for a given Lead object.

    Args:
        lead: Lead model instance containing lead details
              (company_name, industry, country, contact_name).
        tone (str, optional): Tone of the email. Defaults to "Friendly".
        max_words (int, optional): Maximum word count limit. Defaults to 180.

    Returns:
        str: Formatted prompt string for AI model consumption.

    Raises:
        ValueError: If lead object is None.
    """
    if lead is None:
        raise ValueError("Lead object cannot be None.")

    company_name = getattr(lead, 'company_name', '') or 'N/A'
    industry = getattr(lead, 'industry', '') or 'N/A'
    country = getattr(lead, 'country', '') or 'N/A'
    contact_name = getattr(lead, 'contact_name', '') or 'N/A'

    prompt = (
        f"You are an expert B2B sales copywriter.\n\n"
        f"Write a professional cold outreach email.\n\n"
        f"Company:\n{company_name}\n\n"
        f"Industry:\n{industry}\n\n"
        f"Country:\n{country}\n\n"
        f"Contact:\n{contact_name}\n\n"
        f"Requirements:\n"
        f"- {tone} tone\n"
        f"- Mention the company name\n"
        f"- Mention the industry\n"
        f"- Explain software development services\n"
        f"- Maximum {max_words} words\n"
        f"- Include a CTA\n"
        f"- Do not use placeholders."
    )

    return prompt
