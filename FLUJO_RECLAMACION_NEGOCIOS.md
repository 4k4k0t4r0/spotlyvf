# Flujo de Reclamación de Negocios - Spotlyvf

## ¿Qué pasa después de reclamar un negocio?

### 1. **Envío de Reclamación** ✅ (Implementado)
- El usuario reclama un lugar de Google Places a través de `ClaimPlaceScreen`
- Se envían los datos requeridos:
  - Google Place ID
  - Nombre del negocio
  - Número de registro (RUC/Cédula)
  - Teléfono de contacto
  - Email de contacto
  - Mensaje explicativo
- La reclamación se guarda con estado `pending`
- El usuario recibe confirmación de envío

### 2. **Visualización del Estado** ✅ (Implementado)
- **BusinessDashboardScreen**: Muestra contador de reclamaciones pendientes
- **MyClaimsScreen**: Vista detallada de todas las reclamaciones del usuario
- Estados disponibles:
  - 🟡 **Pendiente**: Esperando revisión del administrador
  - 🔵 **En Revisión**: Administrador está evaluando
  - 🟢 **Aprobada**: Reclamación aceptada
  - 🔴 **Rechazada**: Reclamación negada

### 3. **Revisión por Administrador** ✅ (Implementado)
- **Panel de Django Admin**: Los administradores pueden ver todas las reclamaciones
- **Endpoints de API**: `/business/claims/` para gestión programática
- **Acciones disponibles**:
  - Aprobar reclamación
  - Rechazar reclamación
  - Agregar notas administrativas
  - Acción masiva de aprobación/rechazo

### 4. **Proceso de Aprobación** ✅ (Implementado)
Cuando un administrador aprueba una reclamación:
- Se crea/actualiza el `Place` en la base de datos local
- Se marca como `is_claimed=True`
- Se asigna al usuario como propietario (`claimed_by`)
- Se actualiza el estado a `approved`
- Se registra la fecha de aprobación

### 5. **Acceso al Dashboard de Negocio** ✅ (Implementado)
Después de la aprobación, el usuario puede:
- Acceder al dashboard completo de negocio
- Gestionar reservas
- Responder reseñas
- Ver estadísticas y analytics
- Configurar políticas de reservas
- Actualizar información del lugar

### 6. **Funcionalidades Disponibles Post-Aprobación**

#### Dashboard de Negocio (`BusinessDashboardScreen`)
- Estadísticas de lugares
- Reservas pendientes/confirmadas
- Reseñas sin responder
- Rating promedio

#### Gestión de Reservas (`BusinessReservationsScreen`)
- Ver todas las reservas
- Aprobar/rechazar reservas pendientes
- Filtrar por estado
- Responder con notas o motivos de rechazo

#### Gestión de Reseñas (`BusinessReviewsScreen`)
- Ver todas las reseñas
- Responder a reseñas
- Filtrar reseñas sin respuesta

#### Analytics (`BusinessAnalyticsScreen`)
- Gráficos de reservas por día
- Distribución de ratings
- Lugares más populares

### 7. **Estados y Notificaciones**

#### Para el Usuario:
- ✅ Visualización del estado en tiempo real
- ✅ Detalles de la reclamación
- ✅ Razones de rechazo (si aplica)
- ✅ Notas del administrador
- ✅ Acceso directo al dashboard al ser aprobado

#### Para el Administrador:
- ✅ Panel de administración Django
- ✅ Endpoints API para gestión
- ✅ Acciones masivas
- ✅ Historial de cambios

### 8. **Casos de Uso y Flujos**

#### Flujo Exitoso:
1. Usuario reclama lugar → Estado: `pending`
2. Admin revisa documentación → Estado: `under_review`
3. Admin aprueba → Estado: `approved` + lugar asignado
4. Usuario accede a dashboard de negocio
5. Usuario gestiona reservas y reseñas

#### Flujo de Rechazo:
1. Usuario reclama lugar → Estado: `pending`
2. Admin revisa documentación → Estado: `under_review`
3. Admin rechaza con motivo → Estado: `rejected`
4. Usuario ve motivo de rechazo
5. Usuario puede hacer nueva reclamación con mejor documentación

### 9. **Próximas Mejoras Sugeridas**

#### Notificaciones Push (Pendiente)
- Notificar cuando cambia el estado de la reclamación
- Alertas de nuevas reservas
- Recordatorios de reseñas sin responder

#### Email Notifications (Pendiente)
- Confirmación de reclamación enviada
- Notificación de aprobación/rechazo
- Resúmenes periódicos de actividad

#### Documentos de Verificación (Pendiente)
- Subida de archivos (RUC, cédula, etc.)
- Galería de documentos en el admin
- Validación automática de documentos

#### Dashboard Mejorado (Pendiente)
- Más métricas y KPIs
- Exportación de reportes
- Integración con calendarios
- Chat con clientes

### 10. **Archivos Clave del Sistema**

#### Backend:
- `models.py`: Modelo `PlaceClaim` con estados y validaciones
- `business_views.py`: Endpoints para gestión de reclamaciones
- `admin.py`: Panel de administración con acciones masivas
- `serializers.py`: Serialización de datos de reclamaciones

#### Frontend:
- `ClaimPlaceScreen.tsx`: Formulario de reclamación
- `MyClaimsScreen.tsx`: Lista de reclamaciones del usuario
- `BusinessDashboardScreen.tsx`: Dashboard principal de negocio
- `businessApi.ts`: Llamadas API relacionadas con reclamaciones

### 11. **Testing del Flujo**

Para probar el flujo completo:

1. **Como Usuario**:
   ```
   - Ir a ClaimPlaceScreen
   - Buscar un lugar de Google
   - Llenar formulario de reclamación
   - Enviar reclamación
   - Ir a MyClaimsScreen para ver estado
   ```

2. **Como Administrador**:
   ```
   - Acceder al Django Admin (/admin/)
   - Ir a Place service > Place claims
   - Seleccionar reclamación pendiente
   - Aprobar o rechazar con notas
   ```

3. **Como Usuario Post-Aprobación**:
   ```
   - Ver estado "Aprobado" en MyClaimsScreen
   - Acceder a BusinessDashboard
   - Gestionar reservas y reseñas
   ```

Este flujo completo permite a los negocios reclamar lugares de Google Places y convertirse en usuarios verificados con acceso completo a las herramientas de gestión de Spotlyvf.
