from django.contrib.auth.models import User
from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Message, Room
from .serializers import (
    MessageSerializer,
    RegisterSerializer,
    RoomSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/  →  {access, refresh}

    AllowAny is required because the global REST_FRAMEWORK setting
    defaults to IsAuthenticated. Login is the one endpoint that must
    be reachable without a token.
    """
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/  →  creates a user."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET /api/auth/me/  →  who am I?"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RoomViewSet(viewsets.ModelViewSet):
    """
    GET    /api/rooms/          → list rooms
    POST   /api/rooms/          → create a room
    GET    /api/rooms/{slug}/   → room detail
    """
    queryset = Room.objects.all().select_related('created_by')
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MessageViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """GET /api/rooms/{room_slug}/messages/  → message history."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_slug = self.kwargs.get('room_slug')
        return Message.objects.filter(room__slug=room_slug).select_related('author')
