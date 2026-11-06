from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Bookmark
from .serializers import (
    BookmarkSerializer,
    RegisterSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ -> {access, refresh}"""
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ -> create a user."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET /api/auth/me/ -> current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    CRUD for bookmarks, scoped to the current user.

    GET    /api/bookmarks/              -> list (paginated)
    GET    /api/bookmarks/?q=python     -> search in title/url/description
    GET    /api/bookmarks/?tag=django   -> filter by tag
    POST   /api/bookmarks/              -> create
    GET    /api/bookmarks/{id}/         -> retrieve
    PUT    /api/bookmarks/{id}/         -> update
    PATCH  /api/bookmarks/{id}/         -> partial update
    DELETE /api/bookmarks/{id}/         -> delete
    GET    /api/bookmarks/stats/        -> count + top tags
    """
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Bookmark.objects.filter(owner=self.request.user)

        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(url__icontains=q) |
                Q(description__icontains=q) |
                Q(tags__icontains=q)
            )

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__icontains=tag)

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Aggregate stats for the current user."""
        qs = Bookmark.objects.filter(owner=request.user)
        tag_counter = {}
        for bm in qs.only('tags'):
            for t in (bm.tags or '').split(','):
                t = t.strip()
                if t:
                    tag_counter[t] = tag_counter.get(t, 0) + 1
        top_tags = sorted(tag_counter.items(), key=lambda kv: -kv[1])[:10]
        return Response({
            'total': qs.count(),
            'top_tags': [{'name': name, 'count': count} for name, count in top_tags],
        })
