from django.db import models


class MonitoredURL(models.Model):
    """
    A single URL that we want to monitor.

    Users create these records through the admin panel or the API.
    The background task (Celery) reads them and checks each one on a schedule.
    """

    name = models.CharField(max_length=100, help_text="A friendly name, like 'My Blog'")
    url = models.URLField(help_text="The full URL, like https://example.com")
    is_active = models.BooleanField(default=True, help_text="If false, this URL is skipped")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.url})"


class CheckResult(models.Model):
    """
    The result of a single health check for one URL.

    Every 30 seconds, the Celery task creates one of these for each active URL.
    Over time, these build up a history, so you can see when a site was down.
    """

    monitored_url = models.ForeignKey(
        MonitoredURL,
        on_delete=models.CASCADE,
        related_name='checks',
    )
    is_up = models.BooleanField()
    status_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['monitored_url', 'checked_at']),
        ]

    def __str__(self) -> str:
        state = "UP" if self.is_up else "DOWN"
        return f"{self.monitored_url.name} — {state} at {self.checked_at}"
