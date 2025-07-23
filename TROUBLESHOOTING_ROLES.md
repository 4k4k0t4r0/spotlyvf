# 🛠️ Troubleshooting: Separación de Roles en Spotlyvf

## Problema Reportado
Los usuarios normales están viendo opciones de "crear negocio" en la pantalla de reservas cuando solo deberían ver sus propias reservas como clientes.

## ✅ Diagnóstico del Sistema Actual

### 1. Separación de Roles Implementada

**Backend:**
- ✅ Usuarios normales (`USER`): Solo ven reservas que **ellos hicieron** como clientes
  - Endpoint: `/places/reservations/` 
  - Filtro: `Reservation.objects.filter(user=request.user)`

- ✅ Usuarios de negocio (`BUSINESS`): Solo ven reservas **recibidas en sus lugares**
  - Endpoint: `/places/business/reservations/`
  - Filtro: `Reservation.objects.filter(place__in=user_places)`

**Frontend:**
- ✅ Hook `useUserRole` detecta automáticamente el rol del usuario
- ✅ `ReservationsScreen` muestra vistas diferentes según el rol
- ✅ Usuarios normales ven lista de reservas propias
- ✅ Usuarios de negocio son redirigidos al dashboard de negocio

### 2. ¿Dónde Puede Estar el Problema?

**Posibles Causas:**

1. **Usuario registrado incorrectamente**: El usuario se registró como `BUSINESS` sin darse cuenta
2. **Caché del hook**: El hook `useUserRole` puede estar mostrando datos incorrectos
3. **Token expirado**: La sesión puede estar mostrando datos inconsistentes
4. **Pantalla equivocada**: El mensaje puede estar apareciendo en otra pantalla (Feed, Profile)

## 🔍 Cómo Diagnosticar

### Paso 1: Usar el Diagnóstico Integrado
1. Ir a la pantalla de Reservas
2. Tocar el botón de ayuda (❓) en la esquina superior derecha
3. Ejecutar diagnóstico completo
4. Revisar:
   - Rol detectado por el hook
   - Datos en AsyncStorage
   - Respuesta de endpoints

### Paso 2: Verificar Manualmente

**En la app:**
```javascript
// En la consola del navegador o con logs
console.log('User role:', userRole);
console.log('Is business user:', isBusinessUser);
console.log('Is normal user:', isNormalUser);
```

**Verificar AsyncStorage:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Verificar datos del usuario
AsyncStorage.getItem('user_data').then(data => {
  console.log('User data:', JSON.parse(data || '{}'));
});

// Verificar token
AsyncStorage.getItem('auth_token').then(token => {
  console.log('Has token:', !!token);
});
```

### Paso 3: Probar Endpoints Directamente

**Para usuario normal (debería funcionar):**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/places/reservations/
```

**Para usuario normal (debería fallar con 403):**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/places/business/dashboard/
```

## 🔧 Soluciones

### Solución 1: Limpiar Caché
```javascript
// En el diagnóstico o manualmente
await AsyncStorage.clear();
// Reiniciar app y volver a hacer login
```

### Solución 2: Verificar Registro
1. Ir a la pantalla de Profile
2. Verificar que muestre "User" y no "Business Owner"
3. Si muestra "Business Owner", el usuario se registró como negocio

### Solución 3: Cambiar Rol (Si se implementa endpoint)
```javascript
// Llamar endpoint para cambiar rol
await apiClient.postDirect('/auth/change-role/', { role: 'USER' });
```

### Solución 4: Re-registro
1. Cerrar sesión completamente
2. Registrarse nuevamente asegurándose de seleccionar "User" no "Business"

## 📋 Script de Verificación Automática

Ejecutar el script `test_reservation_flow.py` en la raíz del proyecto:

```bash
cd "C:\Users\ASUS TUF A15\Desktop\SPOTLYVF"
python test_reservation_flow.py
```

Este script verifica:
- ✅ Separación correcta de endpoints
- ✅ Permisos por rol
- ✅ Flujo de reservas completo

## 🎯 Identificación del Problema Específico

### ¿Dónde aparece "crea tu negocio"?

**Búsqueda realizada en el código:**
- ❌ No encontrado en `ReservationsScreen.tsx`
- ❌ No encontrado en `FeedScreen.tsx`
- ❌ No encontrado en `ProfileScreen.tsx`
- ❌ No encontrado en ningún archivo `.tsx`

**Posibles ubicaciones:**
1. **Onboarding screens** (pantallas de bienvenida)
2. **Modals o popups** dinámicos
3. **Mensajes del sistema** (notificaciones push)
4. **Pantallas de configuración**
5. **Estados vacíos** en otras pantallas

### Próximos Pasos de Investigación

1. **Buscar en archivos de configuración** y constantes
2. **Revisar mensajes de notificaciones**
3. **Verificar pantallas de onboarding**
4. **Buscar en archivos de localización** (si existen)

## 🚀 Mejoras Implementadas

### 1. Estado Vacío Mejorado
- ✅ Mensaje más claro sobre el propósito de la pantalla
- ✅ Explicación del flujo de reservas
- ✅ Botón de explorar con ícono

### 2. Diagnóstico Integrado
- ✅ Modal de diagnóstico en tiempo real
- ✅ Verificación de rol automática
- ✅ Prueba de endpoints
- ✅ Visualización de datos de sesión

### 3. Validación de Flujo
- ✅ Scripts de prueba automática
- ✅ Verificación de separación de roles
- ✅ Documentación de troubleshooting

## 📞 Contacto de Soporte

Si el problema persiste después de seguir estos pasos:

1. **Capturar screenshot** del mensaje problemático
2. **Ejecutar diagnóstico** y copiar resultados
3. **Verificar logs** de la consola del navegador
4. **Proporcionar información** sobre los pasos que llevaron al problema

---

**Última actualización:** 8 de Julio, 2025  
**Versión del documento:** 1.0
