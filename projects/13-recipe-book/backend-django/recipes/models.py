from django.db import models


class Recipe(models.Model):
    """
    A single recipe.

    Each recipe belongs to a category (like Breakfast, Lunch, Dinner, Dessert)
    and has an optional photo, ingredients list, and cooking instructions.
    """

    class Category(models.TextChoices):
        BREAKFAST = 'breakfast', 'Breakfast'
        LUNCH = 'lunch', 'Lunch'
        DINNER = 'dinner', 'Dinner'
        DESSERT = 'dessert', 'Dessert'
        SNACK = 'snack', 'Snack'

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ingredients = models.TextField(help_text="One ingredient per line")
    instructions = models.TextField(help_text="Step-by-step cooking instructions")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.DINNER)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.EASY)
    prep_time_minutes = models.PositiveIntegerField(default=0)
    cook_time_minutes = models.PositiveIntegerField(default=0)
    servings = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to='recipes/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def total_time_minutes(self) -> int:
        return self.prep_time_minutes + self.cook_time_minutes
