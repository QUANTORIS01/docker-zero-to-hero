import secrets
import string

from django.contrib.auth.models import User
from django.db.models import F, Q, Sum
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ShortURL
from .serializers import (
    RegisterSerializer,
    ShortURLSerializer,
    UserSerializer,
)


# ─── Short code generation ────────────────────────────
ALPHABET = string.ascii_letters + string.digits
CODE_LENGTH = 7


def generate_short_code(length=CODE_LENGTH):
    while True:
        code = ''.join(secrets.choice(ALPHABET) for _ in range(length))
        if not ShortURL.objects.filter(short_code=code).exists():
            return code


# ─── Error pages (returned to end users, not APIs) ────
def _error_page(title: str, message: str, icon: str) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 2rem;
    }}
    .card {{
      background: #1e293b;
      padding: 2.5rem;
      border-radius: 0.75rem;
      max-width: 28rem;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      border: 1px solid #334155;
    }}
    .icon {{ font-size: 3.5rem; margin-bottom: 1rem; }}
    h1 {{ margin: 0 0 0.75rem; font-size: 1.5rem; color: #f1f5f9; }}
    p {{ margin: 0; color: #94a3b8; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
  </div>
</body>
</html>"""


# ─── Auth ─────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── Short URLs CRUD ──────────────────────────────────
class ShortURLViewSet(viewsets.ModelViewSet):
    serializer_class = ShortURLSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ShortURL.objects.filter(owner=self.request.user)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(original_url__icontains=q) | Q(short_code__icontains=q)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user,
            short_code=generate_short_code(),
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = ShortURL.objects.filter(owner=request.user)
        total_clicks = qs.aggregate(total=Sum('clicks'))['total'] or 0
        return Response({
            'total_links': qs.count(),
            'total_clicks': total_clicks,
        })


# ─── Redirect (returns HTML to real users) ────────────
class RedirectView(APIView):
    """
    GET /r/<code>/ -> 302 redirect to the original URL.

    Returns:
      - 302 -> redirect
      - 404 -> HTML error page (unknown code)
      - 410 -> HTML error page (expired link)
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, code):
        try:
            link = ShortURL.objects.get(short_code=code)
        except ShortURL.DoesNotExist:
            return HttpResponse(
                _error_page(
                    'Link Not Found',
                    "This short link doesn't exist or was deleted.",
                    '🔍',
                ),
                status=404,
                content_type='text/html',
            )

        if link.is_expired():
            return HttpResponse(
                _error_page(
                    'Link Expired',
                    'This short link has expired and can no longer be used.',
                    '⏰',
                ),
                status=410,
                content_type='text/html',
            )

        ShortURL.objects.filter(pk=link.pk).update(clicks=F('clicks') + 1)
        return HttpResponseRedirect(link.original_url)
