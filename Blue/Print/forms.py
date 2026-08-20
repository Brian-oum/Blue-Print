from django import forms

DEPARTMENT_CHOICES = [
    ('', 'Business Department'),
    ('sales', 'Sales & Quotes'),
    ('design', 'Design & Print'),
    ('support', 'Customer Support'),
    ('other', 'Other'),
]


class ContactForm(forms.Form):
    """
    Validates the contact page submission. No model backing yet —
    swap this for a ModelForm once a ContactMessage model exists if
    you want submissions stored as well as emailed.
    """
    name = forms.CharField(max_length=150)
    email = forms.EmailField()
    subject = forms.CharField(max_length=200, required=False)
    department = forms.ChoiceField(choices=DEPARTMENT_CHOICES, required=False)
    message = forms.CharField(widget=forms.Textarea)

# Add this import + class to your existing forms.py (alongside ContactForm).


from .models import Testimonial


class TestimonialForm(forms.ModelForm):
    class Meta:
        model = Testimonial
        fields = ['name', 'role', 'email', 'rating', 'message']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Your full name',
            }),
            'role': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Job title / company (optional)',
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'you@example.com (optional, not shown publicly)',
            }),
            'rating': forms.RadioSelect(),
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Tell us about your experience working with us…',
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].required = False
        self.fields['email'].required = False