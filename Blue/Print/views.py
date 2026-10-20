from django.contrib import messages
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView, ListView
from django.views.generic.edit import FormMixin

from .models import Product
from .forms import ContactForm, TestimonialForm


class HomeView(TemplateView):
    template_name = 'Print/home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class AboutView(TemplateView):
    template_name = 'Print/about.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class ServicesView(TemplateView):
    template_name = 'Print/services.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

class PolicyView(TemplateView):
    template_name = 'Print/privacy_policy.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class ContactView(FormMixin, TemplateView):
    """
    Renders the contact page (map hero + info/form card) and handles
    the form's AJAX submission, emailing the enquiry to the office.
    Falls back to a redirect-with-message flow for non-JS submissions.
    """
    template_name = 'Print/contact.html'
    form_class = ContactForm
    success_url = reverse_lazy('contact')

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

        if not form.is_valid():
            if is_ajax:
                return JsonResponse({'success': False, 'error': 'Please check the highlighted fields.'}, status=400)
            return self.form_invalid(form)

        data = form.cleaned_data
        subject = data['subject'] or f"New enquiry from {data['name']}"

        try:
            send_mail(
                subject=f"[Contact Form] {subject}",
                message=(
                    f"Name: {data['name']}\n"
                    f"Email: {data['email']}\n"
                    f"Department: {data.get('department') or 'Not specified'}\n\n"
                    f"{data['message']}"
                ),
                from_email=None,  # uses DEFAULT_FROM_EMAIL from settings
                recipient_list=['info@blueprintagencies.co.ke'],
                fail_silently=False,
            )
        except Exception:
            if is_ajax:
                return JsonResponse(
                    {'success': False, 'error': "Couldn't send your message right now. Please try again shortly."},
                    status=500,
                )
            messages.error(request, "Couldn't send your message right now. Please try again shortly.")
            return self.form_invalid(form)

        if is_ajax:
            return JsonResponse({'success': True})

        messages.success(request, "Thanks — we'll be in touch shortly.")
        return self.form_valid(form)


class ProductListView(ListView):
    """
    Displays active products in a 3-per-row grid, 6 per page (two rows),
    with the remainder reachable through pagination — matches the
    products.html template's layout. Supports filtering by ?category=.
    """
    model = Product
    template_name = 'Print/products.html'
    context_object_name = 'products'
    paginate_by = 6

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category_choices'] = Product.CATEGORY_CHOICES
        context['current_category'] = self.request.GET.get('category', '')
        return context


class TestimonialSubmitView(View):
    """
    Handles the 'Write for us' modal on the homepage testimonials section.
    AJAX-only in practice (the modal's JS always sends the
    X-Requested-With header), with a non-JS fallback that redirects
    back to the homepage with a messages banner.
    New testimonials are saved unapproved (Testimonial.is_approved=False)
    and only appear on the site once approved in the admin.
    """

    def post(self, request, *args, **kwargs):
        form = TestimonialForm(request.POST)
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

        if form.is_valid():
            form.save()
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': "Thanks for sharing your experience!."
                })
            messages.success(request, "Thanks for sharing your experience! .")
            return redirect('home')

        if is_ajax:
            errors = {field: list(errs) for field, errs in form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors}, status=400)
        messages.error(request, "Please check the highlighted fields.")
        return redirect('home')

    def get(self, request, *args, **kwargs):
        return redirect('home')