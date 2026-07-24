from django.db import models

class Campaign(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class ICP(models.Model):
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE)

    industry = models.CharField(max_length=100)
    company_size = models.CharField(max_length=50)
    keywords = models.TextField(help_text="Comma separated keywords")

    def __str__(self):
        return f"ICP for {self.campaign.name}"