from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from sales.views import CampaignViewSet, ICPViewSet 
from leads.urls import router as leads_router
from email_agent.urls import router as email_agent_router

router = DefaultRouter()
# Extend the core router with app routers so they all appear in the same API root
router.registry.extend(leads_router.registry)
router.registry.extend(email_agent_router.registry)
router.register(r'campaigns', CampaignViewSet)
router.register(r'icp', ICPViewSet)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/', permanent=False)),
    path('favicon.ico', lambda request: HttpResponse(status=204)),

    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # Include app urls explicitly
    path('api/', include('leads.urls')),
    path('api/', include('email_agent.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]