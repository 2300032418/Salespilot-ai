from rest_framework import serializers
from .models import Campaign

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'

from .models import Campaign, ICP

class ICPSerializer(serializers.ModelSerializer):
    class Meta:
        model = ICP
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['campaign'] = CampaignSerializer(instance.campaign).data
        return representation