from rest_framework import serializers
from .models import Lead

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_employee_count(self, value):
        """
        Ensure employee count is not negative.
        """
        if value is not None and value < 0:
            raise serializers.ValidationError("Employee count cannot be negative.")
        return value

    def validate_lead_score(self, value):
        """
        Ensure lead score is between 0 and 100.
        """
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError("Lead score must be between 0 and 100.")
        return value

class GenerateLeadsSerializer(serializers.Serializer):
    campaign_id = serializers.IntegerField(required=True)

