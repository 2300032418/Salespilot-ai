from rest_framework import viewsets
from .models import Campaign
from .serializers import CampaignSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer

from .models import Campaign, ICP
from .serializers import CampaignSerializer, ICPSerializer

class ICPViewSet(viewsets.ModelViewSet):
    queryset = ICP.objects.all()
    serializer_class = ICPSerializer