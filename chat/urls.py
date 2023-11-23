from django.contrib.auth.decorators import login_required
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter

from .views import UserViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'chat', ChatMessageViewSet, basename='chat')

urlpatterns = [
    path('api/', include(router.urls)),
    path('', login_required(TemplateView.as_view(template_name='chat/chat.html')), name='users'),
    path('history/', login_required(TemplateView.as_view(template_name='chat/history.html')), name='history'),
]
