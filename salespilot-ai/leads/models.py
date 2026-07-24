from django.db import models
from sales.models import Campaign

class Lead(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('QUALIFIED', 'Qualified'),
        ('CONTACTED', 'Contacted'),
        ('EMAIL_SENT', 'Email Sent'),
        ('REPLIED', 'Replied'),
        ('REJECTED', 'Rejected'),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='leads')
    company_name = models.CharField(max_length=255)
    website = models.URLField(blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    employee_count = models.IntegerField(blank=True, null=True)
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    lead_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.contact_name} at {self.company_name}"
