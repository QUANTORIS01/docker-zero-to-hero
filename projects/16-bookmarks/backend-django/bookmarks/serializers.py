from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Bookmark


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        read_only_fields = ['id']

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class BookmarkSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = ['id', 'url', 'title', 'description', 'tags', 'tags_list', 'owner', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_tags_list(self, obj):
        """Split comma-separated tags into a clean list for the UI."""
        if not obj.tags:
            return []
        return [t.strip() for t in obj.tags.split(',') if t.strip()]
