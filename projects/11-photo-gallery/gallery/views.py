from django.shortcuts import get_object_or_404, render

from .models import Photo


def photo_list(request):
    """Show all photos in a grid."""
    photos = Photo.objects.all()
    return render(request, 'gallery/photo_list.html', {'photos': photos})


def photo_detail(request, pk):
    """Show a single photo with its details."""
    photo = get_object_or_404(Photo, pk=pk)
    return render(request, 'gallery/photo_detail.html', {'photo': photo})
