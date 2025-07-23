# 🏢 Spotlyvf Business Management System

## 📋 Descripción General

El Sistema de Gestión para Negocios de Spotlyvf permite a los propietarios de negocios reclamar, gestionar y optimizar su presencia en la plataforma. Incluye funcionalidades completas para manejo de reservas, reseñas, y analytics.

## 🚀 Funcionalidades Principales

### 1. **Dashboard del Negocio**
- 📊 **Estadísticas en tiempo real**: Reservas pendientes, confirmadas, reseñas totales, rating promedio
- 🔔 **Notificaciones**: Alertas de nuevas reservas y reseñas sin responder
- 📈 **Analytics rápidos**: Actividad reciente y métricas clave
- 🎯 **Acciones rápidas**: Enlaces directos a gestión de reservas y reseñas

### 2. **Gestión de Reservas**
- ✅ **Aprobar/Rechazar**: Control total sobre las reservas entrantes
- 📝 **Notas del negocio**: Agregar información adicional para los clientes
- 🔍 **Filtros**: Por estado, fecha, y más
- 📱 **Interfaz intuitiva**: Gestión fácil desde dispositivos móviles

### 3. **Sistema de Reclamación**
- 🗺️ **Google Places Integration**: Reclama lugares existentes de Google Maps
- 📋 **Proceso de verificación**: Sistema seguro para validar la propiedad
- 📞 **Validación telefónica**: Verificación por número de contacto
- ⏱️ **Seguimiento de estado**: Pendiente, aprobado, rechazado

### 4. **Gestión de Reseñas** (Próximamente)
- 💬 **Responder reseñas**: Interactúa directamente con los clientes
- 🔍 **Filtros avanzados**: Reseñas sin responder, por rating, fecha
- 📊 **Analytics de reseñas**: Distribución por rating y tendencias

## 🔧 Arquitectura Técnica

### Backend (Django REST Framework)
```
apps/place_service/
├── business_views.py      # Endpoints específicos para negocios
├── models.py             # Modelos extendidos (Place, Review, Reservation)
├── serializers.py        # Serializers para APIs de negocio
└── urls.py              # Rutas para funcionalidades de negocio
```

### Frontend (React Native + Expo)
```
src/
├── data/
│   └── businessApi.ts           # Cliente API para negocios
├── presentation/
│   ├── screens/
│   │   ├── BusinessDashboardScreen.tsx
│   │   ├── BusinessReservationsScreen.tsx
│   │   └── ClaimPlaceScreen.tsx
│   └── navigation/
│       └── types.ts             # Tipos de navegación extendidos
```

## 🗃️ Modelos de Base de Datos

### Lugar Extendido (Place)
```python
class Place(models.Model):
    # Campos existentes...
    
    # Integración con Google Places
    google_place_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Gestión de reclamación
    is_claimed = models.BooleanField(default=False)
    claimed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    
    # Configuración de reservas
    accepts_reservations = models.BooleanField(default=True)
    auto_approve_reservations = models.BooleanField(default=False)
    max_advance_days = models.IntegerField(default=30)
    
    # Información del negocio
    business_phone = models.CharField(max_length=20, blank=True)
    business_email = models.EmailField(blank=True)
```

### Reserva con Aprobación (Reservation)
```python
class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('rejected', 'Rechazada'),
        ('cancelled', 'Cancelada'),
        ('completed', 'Completada'),
    ]
    
    # Campos existentes...
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Gestión por el negocio
    business_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
```

### Reclamación de Lugar (PlaceClaim)
```python
class PlaceClaim(models.Model):
    claimant = models.ForeignKey(User, on_delete=models.CASCADE)
    google_place_id = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20)
    business_proof = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
```

### Reseña con Respuesta (Review)
```python
class Review(models.Model):
    # Campos existentes...
    
    # Respuesta del negocio
    business_response = models.TextField(blank=True, null=True)
    business_response_date = models.DateTimeField(blank=True, null=True)
    business_responder = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

## 🌐 API Endpoints

### Dashboard
- `GET /api/v1/business/dashboard/` - Estadísticas y estado general
- `GET /api/v1/business/analytics/?days=30` - Analytics detallados

### Reservas
- `GET /api/v1/business/reservations/` - Lista de reservas
- `POST /api/v1/business/approve_reservation/` - Aprobar reserva
- `POST /api/v1/business/reject_reservation/` - Rechazar reserva

### Reclamaciones
- `POST /api/v1/business/claim_google_place/` - Reclamar lugar de Google
- `GET /api/v1/business/my_claims/` - Mis reclamaciones

### Reseñas
- `GET /api/v1/business/reviews/` - Reseñas del negocio
- `POST /api/v1/business/respond_to_review/` - Responder reseña

### Configuración
- `POST /api/v1/business/update_place_settings/` - Actualizar configuraciones

## 🔄 Flujo de Trabajo

### 1. Reclamación de Lugar
```
1. Negocio encuentra su lugar en Google Places
2. Obtiene el Google Place ID
3. Envía reclamación con datos de contacto
4. Admin revisa y aprueba/rechaza
5. Si se aprueba, el lugar se vincula al negocio
```

### 2. Gestión de Reservas
```
1. Cliente hace reserva → Estado: 'pending'
2. Negocio recibe notificación
3. Negocio aprueba → Estado: 'confirmed'
   O rechaza → Estado: 'rejected'
4. Cliente recibe notificación del resultado
```

### 3. Respuesta a Reseñas
```
1. Cliente deja reseña
2. Negocio ve reseña en dashboard
3. Negocio responde públicamente
4. Respuesta aparece junto a la reseña
```

## 🎯 Próximas Funcionalidades

### En Desarrollo
- [ ] **BusinessReviewsScreen**: Gestión completa de reseñas
- [ ] **BusinessAnalyticsScreen**: Analytics detallados con gráficos
- [ ] **BusinessPlacesScreen**: Gestión de múltiples lugares
- [ ] **BusinessSettingsScreen**: Configuraciones del negocio

### Futuras Mejoras
- [ ] **Sistema de notificaciones push**
- [ ] **Chat en tiempo real con clientes**
- [ ] **Sistema de promociones y descuentos**
- [ ] **Integración con sistemas de pago**
- [ ] **Reports automáticos por email**
- [ ] **Multi-tenancy para cadenas de negocios**

## 🛠️ Cómo Usar

### Para Desarrolladores

1. **Configurar Backend**:
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

2. **Configurar Frontend**:
```bash
cd frontend
npm install
npx expo start
```

3. **Acceder al Dashboard**:
   - Ve a Profile → Business Dashboard
   - Si no tienes lugares, usa "Reclamar Lugar de Google"

### Para Usuarios de Negocio

1. **Registro**: Crea una cuenta en Spotlyvf
2. **Acceso**: Ve a Profile → Business Dashboard
3. **Reclamación**: Usa "Reclamar Lugar de Google" para vincular tu negocio
4. **Gestión**: Administra reservas y reseñas desde el dashboard

## 📚 Documentación Adicional

- [API Reference](./API_REFERENCE.md) (Próximamente)
- [User Guide](./USER_GUIDE.md) (Próximamente)
- [Admin Guide](./ADMIN_GUIDE.md) (Próximamente)

## 🤝 Contribuir

Para contribuir al desarrollo del sistema de negocios:

1. Fork el repositorio
2. Crea una rama feature: `git checkout -b feature/business-analytics`
3. Commit tus cambios: `git commit -m 'Add business analytics'`
4. Push a la rama: `git push origin feature/business-analytics`
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema de negocios:
- 📧 Email: dev@spotlyvf.com
- 💬 Slack: #business-system
- 📋 Issues: GitHub Issues

---

**Nota**: Este sistema está en constante desarrollo. Las funcionalidades marcadas como "Próximamente" están en la hoja de ruta y serán implementadas en futuras versiones.
