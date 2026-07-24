from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead
from .serializers import LeadSerializer, GenerateLeadsSerializer
from sales.models import Campaign
from .services.lead_generator import DUMMY_COMPANIES
import re

class LeadViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides default `create()`, `retrieve()`, `update()`,
    `partial_update()`, `destroy()` and `list()` actions.
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

    @action(detail=False, methods=['post'], serializer_class=GenerateLeadsSerializer)
    def generate(self, request):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        campaign_id = serializer.validated_data['campaign_id']
        
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if not hasattr(campaign, 'icp'):
            return Response({"error": "Campaign does not have an ICP defined."}, status=status.HTTP_400_BAD_REQUEST)
            
        icp = campaign.icp
        saved_leads = []
        duplicate_companies = []

        # Parse the company size limit from ICP (extract the maximum number if range provided)
        max_size = None
        if icp.company_size:
            nums = re.findall(r'\d+', icp.company_size)
            if nums:
                max_size = int(nums[-1])

        for dummy in DUMMY_COMPANIES:
            # Match rules: Industry == ICP Industry, Country matches ICP Keywords, Employee Count <= Company Size

            match_industry = (icp.industry.lower() == dummy['Industry'].lower()) if icp.industry else True
            match_country = (dummy['Country'].lower() in icp.keywords.lower()) if icp.keywords else True
            match_size = (dummy['Employee Count'] <= max_size) if max_size is not None else True

            if match_industry and match_country and match_size:
                # Check for duplicate by campaign + company_name
                if Lead.objects.filter(campaign=campaign, company_name=dummy['Company Name']).exists():
                    duplicate_companies.append(dummy['Company Name'])
                else:
                    lead = Lead.objects.create(
                        campaign=campaign,
                        company_name=dummy['Company Name'],
                        website=dummy['Website'],
                        industry=dummy['Industry'],
                        country=dummy['Country'],
                        employee_count=dummy['Employee Count'],
                        contact_name=dummy['Contact Name'],
                        contact_email=dummy['Contact Email'],
                        lead_score=dummy['Lead Score'],
                        status='NEW'
                    )
                    saved_leads.append(lead)

        skipped_count = len(duplicate_companies)

        # All matched companies were already existing leads
        if not saved_leads and skipped_count > 0:
            return Response({
                "message": "No new leads generated.",
                "generated_count": 0,
                "skipped_duplicates": skipped_count,
            }, status=status.HTTP_200_OK)

        # Nothing matched the ICP at all
        if not saved_leads:
            return Response({"message": "No matching leads found."}, status=status.HTTP_200_OK)

        lead_serializer = LeadSerializer(saved_leads, many=True)
        return Response({
            "message": "Lead generation completed.",
            "generated_count": len(saved_leads),
            "skipped_duplicates": skipped_count,
            "generated_leads": lead_serializer.data,
            "duplicate_companies": duplicate_companies,
        }, status=status.HTTP_201_CREATED)
