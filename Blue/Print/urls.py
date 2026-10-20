from django.urls import path
from .views import *

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('about/', AboutView.as_view(), name='about'),
    path('services/', ServicesView.as_view(), name='services'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('products/', ProductListView.as_view(), name='products'),
    path('testimonials/submit/', TestimonialSubmitView.as_view(), name='testimonial_submit'),
    # urls.py
    path("privacy-policy/", PolicyView.as_view(), name="privacy_policy"),
]