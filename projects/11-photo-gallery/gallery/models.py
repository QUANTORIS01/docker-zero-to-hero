from django.db import models


class Photo(models.Model):
    """
    A single photo in the gallery.

    Photos are uploaded through the Django admin panel.
    The file is stored at MEDIA_ROOT/photos/YYYY/MM/filename.
    """

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='photos/%Y/%m/')
    photographer = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title
