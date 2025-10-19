from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Auth (Djoser + JWT + Social)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('auth/', include('djoser.social.urls')),   # <-- reemplaza social_django
    path('auth/', include('djoser.social.urls')), # <--- Añade esta línea
    path('social/', include('social_django.urls', namespace='social')),

    # CKEditor uploader
    path('ckeditor/', include('ckeditor_uploader.urls')),
    path('api/user/', include('apps.user.urls')),
    
]

# Media en dev
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA fallback (NO debe capturar admin/api/auth/static/media/ckeditor)
urlpatterns += [
    re_path(
        r'^(?!admin/|api/|auth/|static/|media/|ckeditor/).*$',
        TemplateView.as_view(template_name='index.html')
    ),
]
