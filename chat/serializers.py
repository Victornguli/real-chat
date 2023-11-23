from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from .models import Message


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'id']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True},
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class CustomRelatedField(serializers.SlugRelatedField):
    def to_representation(self, value):
        return {'id': value.id, 'username': value.username}


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = CustomRelatedField(many=False, slug_field='username', read_only=True)
    receiver = CustomRelatedField(many=False, slug_field='username', read_only=True)
    receiver_id = serializers.IntegerField(source='receiver.id', write_only=True)

    class Meta:
        model = Message
        fields = '__all__'

    def get_sender(self, obj):
        return {'id': obj.sender.id, 'username': obj.sender.username}

    def get_receiver(self, obj):
        return {'id': obj.receiver.id, 'username': obj.receiver.username}

    def create(self, validated_data):
        auth_user = self.context['request'].user
        receiver = get_object_or_404(
            User, id=validated_data['receiver']['id'])
        msg = Message(
            receiver=receiver, sender=auth_user, text=validated_data['text'])
        msg.save()
        return msg
