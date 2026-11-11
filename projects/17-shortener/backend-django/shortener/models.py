from django.conf import settings
from django.db import models
from django.utils import timezone


class ShortURL(models.Model):
    """A shortened URL owned by a single user."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='short_urls')
    original_url = models.URLField(max_length=2000)
    short_code = models.CharField(max_length=10, unique=True, db_index=True)
    clicks = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.short_code} -> {self.original_url[:50]}'

    def is_expired(self) -> bool:
        """A link is expired if expires_at is set and is in the past."""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at
