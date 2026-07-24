from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailDraftViewSet

router = DefaultRouter()
router.register(r'email-drafts', EmailDraftViewSet, basename='emaildraft')

urlpatterns = [
    path('', include(router.urls)),
]
