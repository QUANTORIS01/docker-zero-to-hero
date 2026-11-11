from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import ShortURL


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


class ShortURLSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    short_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = ShortURL
        fields = [
            'id', 'original_url', 'short_code', 'short_url',
            'clicks', 'owner', 'created_at', 'expires_at', 'is_expired',
        ]
        read_only_fields = [
            'id', 'short_code', 'short_url', 'clicks',
            'owner', 'created_at', 'is_expired',
        ]

    def get_short_url(self, obj):
        """Return the full redirect URL the user can share."""
        request = self.context.get('request')
        path = f'/r/{obj.short_code}/'
        if request is None:
            return path
        return request.build_absolute_uri(path)

    def get_is_expired(self, obj):
        return obj.is_expired()
