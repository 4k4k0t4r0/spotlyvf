from django.contrib import admin
from .models import PlaceCategory, Place, PlaceImage, PlaceReview, PlaceClaim, BusinessProfile


@admin.register(PlaceCategory)
class PlaceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']


class PlaceImageInline(admin.TabularInline):
    model = PlaceImage
    extra = 1


class PlaceReviewInline(admin.TabularInline):
    model = PlaceReview
    extra = 0
    readonly_fields = ['user', 'rating', 'title', 'comment', 'created_at']


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'city', 'price_range', 'average_rating', 'total_reviews', 'is_active']
    list_filter = ['category', 'price_range', 'city', 'is_active', 'is_verified']
    search_fields = ['name', 'description', 'address', 'city']
    readonly_fields = ['id', 'average_rating', 'total_reviews', 'created_at', 'updated_at']
    inlines = [PlaceImageInline, PlaceReviewInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'category', 'owner')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'address', 'city', 'state', 'country', 'zip_code')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Business Details', {
            'fields': ('price_range', 'features', 'cuisines', 'business_hours')
        }),
        ('Ratings & Reviews', {
            'fields': ('average_rating', 'total_reviews')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PlaceImage)
class PlaceImageAdmin(admin.ModelAdmin):
    list_display = ['place', 'caption', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['place__name', 'caption']


@admin.register(PlaceReview)
class PlaceReviewAdmin(admin.ModelAdmin):
    list_display = ['place', 'user', 'rating', 'title', 'is_verified', 'created_at']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['place__name', 'user__username', 'title', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PlaceClaim)
class PlaceClaimAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'claimant', 'google_place_id', 'status', 'created_at', 'reviewed_at']
    list_filter = ['status', 'created_at', 'reviewed_at']
    search_fields = ['business_name', 'claimant__email', 'google_place_id', 'business_registration']
    readonly_fields = ['created_at', 'reviewed_at', 'approved_at']
    
    fieldsets = (
        ('Información del Reclamo', {
            'fields': ('claimant', 'google_place_id', 'place', 'status')
        }),
        ('Información del Negocio', {
            'fields': ('business_name', 'business_registration', 'contact_phone', 'contact_email')
        }),
        ('Documentación', {
            'fields': ('claim_message', 'verification_documents')
        }),
        ('Revisión de Administrador', {
            'fields': ('admin_notes',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'reviewed_at', 'approved_at')
        }),
    )
    
    actions = ['approve_claims', 'reject_claims']
    
    def approve_claims(self, request, queryset):
        """Acción para aprobar reclamaciones seleccionadas"""
        from django.utils import timezone
        updated = 0
        for claim in queryset.filter(status='pending'):
            claim.status = 'approved'
            claim.approved_at = timezone.now()
            claim.reviewed_at = timezone.now()
            claim.save()
            updated += 1
        self.message_user(request, f'{updated} reclamaciones aprobadas exitosamente.')
    approve_claims.short_description = "Aprobar reclamaciones seleccionadas"
    
    def reject_claims(self, request, queryset):
        """Acción para rechazar reclamaciones seleccionadas"""
        from django.utils import timezone
        updated = 0
        for claim in queryset.filter(status='pending'):
            claim.status = 'rejected'
            claim.reviewed_at = timezone.now()
            claim.save()
            updated += 1
        self.message_user(request, f'{updated} reclamaciones rechazadas.')
    reject_claims.short_description = "Rechazar reclamaciones seleccionadas"


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'business_name', 'business_type', 'is_verified', 'created_at']
    list_filter = ['business_type', 'is_verified', 'created_at']
    search_fields = ['user__email', 'business_name', 'business_registration']
    readonly_fields = ['created_at', 'updated_at']
