from rest_framework import filters, viewsets

from .models import Recipe
from .serializers import RecipeSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for recipes:
    - GET    /api/recipes/         → list all
    - POST   /api/recipes/         → create new
    - GET    /api/recipes/{id}/    → retrieve one
    - PUT    /api/recipes/{id}/    → update (full)
    - PATCH  /api/recipes/{id}/    → update (partial)
    - DELETE /api/recipes/{id}/    → delete

    Supports:
    - Search:   ?search=chicken
    - Filter:   ?category=dinner
    - Filter:   ?difficulty=easy
    - Ordering: ?ordering=-created_at
    """

    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'ingredients']
    ordering_fields = ['created_at', 'title', 'prep_time_minutes', 'cook_time_minutes']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')

        if category:
            queryset = queryset.filter(category=category)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        return queryset
