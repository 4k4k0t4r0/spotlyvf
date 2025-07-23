# Guía de Despliegue AWS EC2 - Spotlyvf

## Arquitectura de Despliegue

### Opción 1: Instancia Única (Recomendada para desarrollo/testing)
- 1 EC2 instance (t3.large o superior)
- Todos los servicios en Docker
- Base de datos MySQL en la misma instancia

### Opción 2: Arquitectura Distribuida (Recomendada para producción)
- EC2 para Backend Django + APIs
- EC2 para Frontend/Web Server (Nginx)
- RDS MySQL para base de datos
- ElastiCache Redis para cache
- Load Balancer (ALB)

## Prerrequisitos

1. **Cuenta AWS** activa
2. **Dominio** para tu aplicación (opcional pero recomendado)
3. **Certificado SSL** (Let's Encrypt o AWS Certificate Manager)

## Paso 1: Configuración de Seguridad

### 1.1 Crear Key Pair
```bash
# En AWS Console > EC2 > Key Pairs > Create Key Pair
# Nombre: spotlyvf-key
# Descargar el archivo .pem
```

### 1.2 Security Groups
```bash
# Security Group: spotlyvf-backend-sg
# Inbound Rules:
- SSH (22) desde tu IP
- HTTP (80) desde 0.0.0.0/0
- HTTPS (443) desde 0.0.0.0/0
- Custom TCP (8000) desde 0.0.0.0/0  # Django
- Custom TCP (3306) desde VPC        # MySQL
- Custom TCP (6379) desde VPC        # Redis

# Security Group: spotlyvf-db-sg
# Inbound Rules:
- MySQL (3306) desde spotlyvf-backend-sg
```

## Paso 2: Lanzar Instancias EC2

### 2.1 Backend Instance
```bash
# Configuración recomendada:
- AMI: Ubuntu Server 24.04 LTS
- Instance Type: t3.large (2 vCPU, 8 GB RAM)
- Storage: 20 GB GP3
- Security Group: spotlyvf-backend-sg
- Key Pair: spotlyvf-key
```

### 2.2 Configuración de Elastic IP
```bash
# Asignar Elastic IP a la instancia backend
# Esto mantendrá la IP fija ante reinicios
```

## Paso 3: Instalación en EC2

### 3.1 Conectar a la instancia
```bash
# Desde tu máquina local
ssh -i "spotlyvf-key.pem" ubuntu@YOUR_ELASTIC_IP
```

### 3.2 Actualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Instalar Docker y Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 3.4 Instalar utilidades adicionales
```bash
sudo apt install -y git nginx certbot python3-certbot-nginx
```

## Paso 4: Configurar el Proyecto

### 4.1 Clonar/Subir el proyecto
```bash
# Opción 1: Git (recomendado)
git clone YOUR_REPO_URL spotlyvf
cd spotlyvf

# Opción 2: SCP desde tu máquina local
# scp -i "spotlyvf-key.pem" -r ./SPOTLYVF ubuntu@YOUR_ELASTIC_IP:~/spotlyvf
```

### 4.2 Configurar variables de entorno
```bash
# Crear archivo de producción
cp .env.example .env.production
```

## Paso 5: Configuración de Base de Datos

### Opción A: MySQL en Docker (mismo servidor)
- Usar el docker-compose.yml actual
- Configurar backups automáticos

### Opción B: Amazon RDS (recomendado para producción)
```bash
# Crear RDS MySQL instance
# Engine: MySQL 8.0
# Instance Class: db.t3.micro (para empezar)
# Storage: 20 GB GP2
# Multi-AZ: No (para ahorrar costos)
```

## Paso 6: Configuración de Dominio y SSL

### 6.1 Configurar DNS
```bash
# En tu proveedor de dominios:
# A record: tu-dominio.com -> ELASTIC_IP
# A record: api.tu-dominio.com -> ELASTIC_IP
```

### 6.2 Configurar Nginx
```nginx
# /etc/nginx/sites-available/spotlyvf
server {
    listen 80;
    server_name tu-dominio.com api.tu-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.3 Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com -d api.tu-dominio.com
```

## Paso 7: Despliegue

### 7.1 Configurar Docker Compose para producción
```bash
# Usar el archivo docker-compose.prod.yml que crearemos
docker-compose -f docker-compose.prod.yml up -d
```

### 7.2 Ejecutar migraciones
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 7.3 Crear superusuario
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Paso 8: Monitoreo y Logs

### 8.1 Configurar logs
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos de un servicio
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 8.2 Configurar monitoreo básico
```bash
# Instalar htop para monitoreo de recursos
sudo apt install htop

# Configurar log rotation
sudo logrotate -d /etc/logrotate.conf
```

## Paso 9: Backups y Seguridad

### 9.1 Backup de base de datos
```bash
# Script de backup automático
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec spotlyvf_db mysqldump -u root -pKIOya100* spotlyvf > $BACKUP_DIR/backup_$DATE.sql
```

### 9.2 Configurar firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Costos Estimados (mensual)

### Configuración básica:
- EC2 t3.large: ~$60
- Elastic IP: $3.65
- Storage 20GB: ~$2
- **Total: ~$65/mes**

### Configuración producción:
- EC2 t3.large x2: ~$120
- RDS db.t3.micro: ~$15
- ElastiCache: ~$15
- Load Balancer: ~$20
- **Total: ~$170/mes**

## Troubleshooting Común

### Error de conexión a base de datos
```bash
# Verificar que MySQL esté corriendo
docker ps | grep mysql

# Verificar logs de MySQL
docker logs spotlyvf_db
```

### Error de permisos
```bash
# Dar permisos correctos a archivos estáticos
sudo chown -R ubuntu:ubuntu /path/to/staticfiles
```

### Performance lenta
```bash
# Verificar recursos
htop
df -h
docker stats
```

## Siguiente Paso
¿Quieres que empecemos con la **Opción 1** (instancia única) o prefieres la **Opción 2** (arquitectura distribuida)?
