from urllib.parse import quote

from django.db import models
from django.utils.text import slugify

# Blue Print Agencies WhatsApp number, digits only (no "+", spaces, or dashes).
# Matches the "+254 700 123 456" shown in the site topbar.
WHATSAPP_NUMBER = "254 721 960 596"


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('offset', 'Digital & Offset Printing'),
        ('fabric', 'Fabric Branding & Stitching'),
        ('advertising', 'Indoor & Outdoor Advertising'),
        ('stationery', 'Stationery Supplies'),
        ('signs', 'Indoor & Outdoor Signs'),
        ('giveway', 'Giveaway & Promotional Items'),
        ('graphic', 'Graphic Design'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    image = models.ImageField(upload_to='products/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Untick to hide this product from the site without deleting it."
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Lower numbers are shown first."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def whatsapp_url(self):
        """
        Builds a wa.me link pre-filled with a quote request for this product.
        Clicking 'Get a Quote' opens WhatsApp with this message ready to send.
        """
        message = f"Hi, I'd like to get a quote for: {self.name}"
        return f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(message)}"


class Testimonial(models.Model):
    """
    Submitted through the 'Write for us' modal on the testimonials section.
    Hidden from the site by default (is_approved=False) until a staff
    member reviews and approves it in the admin.
    """
    RATING_CHOICES = [(i, f"{i} star{'s' if i != 1 else ''}") for i in range(1, 6)]

    name = models.CharField(max_length=120)
    role = models.CharField(
        max_length=150,
        blank=True,
        help_text="Job title / company, e.g. 'CEO, Casey & Co.'"
    )
    email = models.EmailField(
        blank=True,
        help_text="Not shown publicly — only used if we need to follow up."
    )
    avatar = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=5)
    message = models.TextField()
    is_approved = models.BooleanField(
        default=False,
        help_text="Tick to make this testimonial visible on the site."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rating}★)"