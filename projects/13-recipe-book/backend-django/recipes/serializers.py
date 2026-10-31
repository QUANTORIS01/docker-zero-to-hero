from rest_framework import serializers

from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Recipe model.

    - 'category_display' and 'difficulty_display' give React the human-readable
      labels (like "Breakfast" instead of "breakfast").
    - 'total_time_minutes' is a computed field (prep + cook).
    """

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id',
            'title',
            'description',
            'ingredients',
            'instructions',
            'category',
            'category_display',
            'difficulty',
            'difficulty_display',
            'prep_time_minutes',
            'cook_time_minutes',
            'total_time_minutes',
            'servings',
            'photo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
