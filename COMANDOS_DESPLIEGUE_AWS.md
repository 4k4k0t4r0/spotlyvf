# GUÍA RÁPIDA DE COMANDOS PARA DESPLIEGUE EN AWS EC2

## 1. PREPARACIÓN LOCAL (Antes de subir a EC2)

### Comprimir el proyecto para subirlo
```powershell
# En Windows PowerShell, desde la raíz del proyecto
tar -czf spotlyvf-project.tar.gz . --exclude=.git --exclude=node_modules --exclude=.venv --exclude=__pycache__
```

### O usar Git (recomendado)
```powershell
# Subir a un repositorio Git privado
git add .
git commit -m "Preparar para despliegue AWS"
git push origin main
```

## 2. CREAR INSTANCIA EC2

### En AWS Console:
1. **EC2 Dashboard** → **Launch Instance**
2. **Name**: `spotlyvf-production`
3. **AMI**: Ubuntu Server 24.04 LTS (Free tier eligible)
4. **Instance type**: `t3.large` (recomendado) o `t2.micro` (para pruebas)
5. **Key pair**: Crear nueva `spotlyvf-key.pem`
6. **Security group**: Crear nuevo con estas reglas:
   ```
   SSH (22) - Tu IP
   HTTP (80) - 0.0.0.0/0
   HTTPS (443) - 0.0.0.0/0
   Custom TCP (8000) - 0.0.0.0/0
   ```
7. **Storage**: 20 GB gp3
8. **Launch instance**

### Asignar Elastic IP:
```
EC2 Dashboard → Elastic IPs → Allocate → Associate to instance
```

## 3. CONECTAR Y CONFIGURAR EC2

### Conectar por SSH
```powershell
# Cambiar permisos del key (en Git Bash o WSL)
chmod 400 spotlyvf-key.pem

# Conectar (reemplazar ELASTIC_IP con tu IP)
ssh -i "spotlyvf-key.pem" ubuntu@ELASTIC_IP
```

### Primera configuración en EC2
```bash
# Descargar y ejecutar script de setup
wget https://raw.githubusercontent.com/tu-repo/spotlyvf/main/deploy_ec2.sh
chmod +x deploy_ec2.sh
./deploy_ec2.sh
```

## 4. SUBIR EL PROYECTO

### Opción A: Clonar desde Git (recomendado)
```bash
cd /home/ubuntu/spotlyvf
git clone https://github.com/tu-usuario/spotlyvf.git .
```

### Opción B: Subir archivos por SCP
```powershell
# Desde tu máquina local
scp -i "spotlyvf-key.pem" -r ./SPOTLYVF/* ubuntu@ELASTIC_IP:/home/ubuntu/spotlyvf/
```

## 5. CONFIGURAR VARIABLES DE ENTORNO

```bash
# En el servidor EC2
cd /home/ubuntu/spotlyvf
cp .env.production.example .env.production
nano .env.production
```

### Configuración mínima requerida:
```env
DEBUG=False
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria
ALLOWED_HOSTS=tu-dominio.com,api.tu-dominio.com,TU_ELASTIC_IP
DB_NAME=spotlyvf
DB_USER=spotlyvf_user
DB_PASSWORD=password-seguro-para-db
DB_ROOT_PASSWORD=password-root-muy-seguro
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,https://api.tu-dominio.com
DOMAIN_NAME=tu-dominio.com
ADMIN_EMAIL=admin@tu-dominio.com
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps
```

## 6. CONFIGURAR DOMINIO (OPCIONAL)

### En tu proveedor de dominio:
```
Tipo A: tu-dominio.com → TU_ELASTIC_IP
Tipo A: api.tu-dominio.com → TU_ELASTIC_IP
Tipo A: www.tu-dominio.com → TU_ELASTIC_IP
```

## 7. DESPLEGAR LA APLICACIÓN

```bash
cd /home/ubuntu/spotlyvf

# Dar permisos de ejecución a scripts
chmod +x deploy.sh setup_ssl.sh monitor.sh backup.sh

# Realizar primer despliegue
./deploy.sh
```

## 8. CONFIGURAR SSL (SI TIENES DOMINIO)

```bash
# Ejecutar script de SSL
sudo ./setup_ssl.sh
```

## 9. VERIFICAR DESPLIEGUE

### Verificar que todos los servicios estén corriendo:
```bash
./monitor.sh
```

### Verificar logs:
```bash
# Logs de todos los servicios
docker-compose -f docker-compose.prod.yml logs

# Logs específicos del backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Probar endpoints:
```bash
# Health check
curl http://ELASTIC_IP:8000/health/

# API test
curl http://ELASTIC_IP:8000/api/

# Con dominio y SSL
curl https://api.tu-dominio.com/health/
```

## 10. COMANDOS DE MANTENIMIENTO

### Actualizar aplicación:
```bash
cd /home/ubuntu/spotlyvf
git pull origin main  # Si usas Git
./deploy.sh
```

### Backup manual:
```bash
./backup.sh
```

### Reiniciar servicios:
```bash
docker-compose -f docker-compose.prod.yml restart

# O reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart backend
```

### Ver estadísticas del sistema:
```bash
# Recursos del sistema
htop

# Estadísticas de Docker
docker stats

# Espacio en disco
df -h

# Estado de servicios
docker-compose -f docker-compose.prod.yml ps
```

### Entrar en el contenedor del backend:
```bash
docker-compose -f docker-compose.prod.yml exec backend bash

# Ejecutar comandos Django
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 11. TROUBLESHOOTING COMÚN

### Error de conexión a base de datos:
```bash
# Verificar que MySQL esté corriendo
docker-compose -f docker-compose.prod.yml ps db

# Ver logs de MySQL
docker-compose -f docker-compose.prod.yml logs db

# Reiniciar base de datos
docker-compose -f docker-compose.prod.yml restart db
```

### Error 502 Bad Gateway:
```bash
# Verificar que el backend esté corriendo
docker-compose -f docker-compose.prod.yml ps backend

# Ver logs del backend
docker-compose -f docker-compose.prod.yml logs backend

# Verificar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Problemas de SSL:
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado manualmente
sudo certbot renew

# Verificar configuración SSL
curl -I https://tu-dominio.com
```

## 12. CONFIGURACIÓN FRONTEND (React Native)

### Actualizar la configuración de API en el frontend:
```typescript
// En tu archivo de configuración API
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'  // Desarrollo
  : 'https://api.tu-dominio.com/api'; // Producción
```

### Build para producción:
```bash
# En tu máquina local
cd frontend
expo build:web  # Para web
expo build:android  # Para Android
expo build:ios  # Para iOS
```

## COSTOS ESTIMADOS MENSUALES:
- EC2 t3.large: ~$60 USD
- Elastic IP: ~$3.65 USD
- EBS Storage 20GB: ~$2 USD
- **Total básico: ~$65 USD/mes**

## PRÓXIMOS PASOS OPCIONALES:
1. **Configurar CDN** (CloudFront) para archivos estáticos
2. **Migrar a RDS** para base de datos administrada
3. **Configurar ElastiCache** para Redis administrado
4. **Implementar Load Balancer** para alta disponibilidad
5. **Configurar monitoreo** con CloudWatch
6. **Backup automático** a S3
