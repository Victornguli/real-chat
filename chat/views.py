from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination

from .models import Message
from .serializers import UserSerializer, ChatMessageSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    allowed_methods = ['GET', 'HEAD', 'OPTIONS']

    def list(self, request, *args, **kwargs):
        self.queryset = self.queryset.exclude(id=request.user.id)
        return super().list(request, *args, **kwargs)


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    allowed_methods = ['GET', 'POST', 'HEAD', 'OPTIONS']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = Message.objects.filter(Q(sender=self.request.user) | Q(receiver=self.request.user))
        recipient_id = self.request.query_params.get('recipient')
        if recipient_id:
            queryset = queryset.filter(
                Q(sender=self.request.user, receiver__id=recipient_id) |
                Q(sender__id=recipient_id, receiver=self.request.user)
            )

        return queryset
