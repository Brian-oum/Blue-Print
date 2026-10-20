from django.contrib import admin
from django.utils.html import format_html

from .models import Product, Testimonial


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'name', 'category', 'is_active', 'order', 'created_at')
    list_display_links = ('thumbnail', 'name')
    list_editable = ('is_active', 'order')
    list_filter = ('is_active', 'category')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order', '-created_at')
    exclude = ('description',)

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:45px;width:45px;object-fit:cover;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"
    thumbnail.short_description = "Image"


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'rating', 'is_approved', 'created_at')
    list_display_links = ('name',)
    list_editable = ('is_approved',)
    list_filter = ('is_approved', 'rating')
    search_fields = ('name', 'role', 'email', 'message')
    ordering = ('-created_at',)
    actions = ['approve_testimonials']

    def approve_testimonials(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} testimonial(s) approved.")
    approve_testimonials.short_description = "Approve selected testimonials"