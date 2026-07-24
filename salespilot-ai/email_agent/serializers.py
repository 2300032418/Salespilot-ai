from rest_framework import serializers
from .models import EmailDraft
from leads.models import Lead


# ------------------------------------------------------------------
# Nested serializer — used for READ operations only
# ------------------------------------------------------------------

class LeadSummarySerializer(serializers.ModelSerializer):
    """
    A lightweight, read-only representation of a Lead.
    Embedded inside EmailDraftSerializer so callers get human-readable
    lead info instead of a bare integer FK.
    """

    class Meta:
        model = Lead
        fields = ['id', 'company_name', 'contact_name', 'contact_email']
        read_only_fields = fields


# ------------------------------------------------------------------
# Main serializer
# ------------------------------------------------------------------

class EmailDraftSerializer(serializers.ModelSerializer):
    """
    Serializer for the EmailDraft model.

    Read  → `lead` is expanded into a nested LeadSummarySerializer object.
    Write → `lead` is accepted as a plain integer (Lead PK) via `lead_id`.
    """

    # Nested read-only representation of the linked Lead
    lead = LeadSummarySerializer(read_only=True)

    # Write-only field that accepts the Lead PK on create / update
    lead_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.all(),
        source='lead',
        write_only=True,
        help_text='Primary key of the Lead this draft belongs to.',
    )

    class Meta:
        model = EmailDraft
        fields = [
            'id',
            'lead',       # nested object  (read)
            'lead_id',    # integer PK     (write)
            'subject',
            'body',
            'tone',
            'status',
            'approved',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    # ------------------------------------------------------------------
    # Field-level validation
    # ------------------------------------------------------------------

    def validate_subject(self, value):
        """Subject cannot be blank or whitespace-only."""
        if not value or not value.strip():
            raise serializers.ValidationError("Subject cannot be empty.")
        return value.strip()

    def validate_body(self, value):
        """Body cannot be blank or whitespace-only."""
        if not value or not value.strip():
            raise serializers.ValidationError("Body cannot be empty.")
        return value.strip()

    def validate_tone(self, value):
        """Tone must be one of the defined choices."""
        valid_tones = [choice[0] for choice in EmailDraft.Tone.choices]
        if value not in valid_tones:
            raise serializers.ValidationError(
                f"Invalid tone '{value}'. Must be one of: {', '.join(valid_tones)}."
            )
        return value

    def validate_status(self, value):
        """Status must be one of the defined choices."""
        valid_statuses = [choice[0] for choice in EmailDraft.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status '{value}'. Must be one of: {', '.join(valid_statuses)}."
            )
        return value


# ------------------------------------------------------------------
# AI Generation Input Serializer
# ------------------------------------------------------------------

class GenerateEmailSerializer(serializers.Serializer):
    """
    Serializer for validating input parameters on the AI Email Generation endpoint.
    Expects only lead_id and an optional tone.
    """
    lead_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.all(),
        source='lead',
        required=True,
        help_text='ID of the Lead to generate an email for.'
    )
    tone = serializers.ChoiceField(
        choices=EmailDraft.Tone.choices,
        default=EmailDraft.Tone.PROFESSIONAL,
        required=False,
        help_text='Tone for the generated email.'
    )

