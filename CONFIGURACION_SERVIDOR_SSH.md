# 🛠️ CONFIGURACIÓN DEL SERVIDOR EC2 - Spotlyvf
## Ya conectado por SSH - Siguientes pasos

---

## 🚀 PASO 1: Actualizar el Sistema

```bash
# Ejecutar en tu terminal SSH
sudo apt update && sudo apt upgrade -y
```

**Esto tardará unos minutos. Espera a que termine completamente.**

---

## 🐳 PASO 2: Instalar Docker

```bash
# Descargar e instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker
sudo usermod -aG docker ubuntu

# Limpiar archivo temporal
rm get-docker.sh

# Verificar instalación
docker --version
```

**Deberías ver algo como: `Docker version 24.x.x`**

---

## 🔧 PASO 3: Instalar Docker Compose

```bash
# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

**Deberías ver algo como: `Docker Compose version v2.x.x`**

---

## 📦 PASO 4: Instalar Herramientas Adicionales

```bash
# Instalar utilidades necesarias
sudo apt install -y git nginx certbot python3-certbot-nginx htop curl wget unzip tree
```

---

## 📁 PASO 5: Crear Estructura de Directorios

```bash
# Crear directorio principal del proyecto
mkdir -p /home/ubuntu/spotlyvf
cd /home/ubuntu/spotlyvf

# Crear directorios necesarios
mkdir -p {backups,logs,certbot/{conf,www},nginx}

# Verificar estructura
tree -L 2
```

---

## 🔄 PASO 6: Reiniciar Sesión (Importante)

```bash
# Salir de la sesión SSH para que los cambios de Docker tomen efecto
exit
```

**Luego vuelve a conectarte:**
```bash
# Desde tu máquina local
ssh -i "spotlyvf-key.pem" ubuntu@TU_ELASTIC_IP
```

**Una vez reconectado, verifica Docker:**
```bash
# Verificar que Docker funciona sin sudo
docker ps
```

**Deberías ver una tabla vacía (sin errores)**

---

## 📥 PASO 7: Subir el Proyecto

### Opción A: Usando Git (Recomendado)
```bash
cd /home/ubuntu/spotlyvf

# Si tienes tu proyecto en GitHub
git clone https://github.com/TU_USUARIO/TU_REPO.git .

# O si es privado:
git clone https://TU_TOKEN@github.com/TU_USUARIO/TU_REPO.git .
```

### Opción B: Subir archivos manualmente por SCP
**Desde tu máquina local** (nueva terminal/cmd):
```powershell
# Navegar a donde tienes el proyecto
cd "C:\Users\ASUS TUF A15\Desktop\SPOTLYVF"

# Subir todos los archivos (esto puede tardar)
scp -i "spotlyvf-key.pem" -r * ubuntu@TU_ELASTIC_IP:/home/ubuntu/spotlyvf/
```

### Opción C: Crear archivos manualmente
Si prefieres, puedes crear los archivos uno por uno en el servidor.

---

## ⚙️ PASO 8: Configurar Variables de Entorno

```bash
cd /home/ubuntu/spotlyvf

# Crear archivo de configuración de producción
cp .env.production.example .env.production

# Editar con tus valores
nano .env.production
```

**Configuración mínima requerida:**
```env
DEBUG=False
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria-cambia-esto
ALLOWED_HOSTS=TU_ELASTIC_IP,tu-dominio.com,api.tu-dominio.com
DB_NAME=spotlyvf
DB_USER=spotlyvf_user
DB_PASSWORD=password-seguro-para-base-datos
DB_ROOT_PASSWORD=password-root-muy-seguro
CORS_ALLOWED_ORIGINS=http://TU_ELASTIC_IP:8000,https://tu-dominio.com
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps
DOMAIN_NAME=tu-dominio.com
ADMIN_EMAIL=admin@tu-dominio.com
```

**Para guardar en nano:** `Ctrl + X`, luego `Y`, luego `Enter`

---

## 🚢 PASO 9: Primer Despliegue

```bash
# Asegurarse de estar en el directorio correcto
cd /home/ubuntu/spotlyvf

# Dar permisos a scripts
chmod +x deploy.sh setup_ssl.sh monitor.sh backup.sh

# Verificar que todos los archivos estén presentes
ls -la

# Ejecutar primer despliegue
./deploy.sh
```

**Este proceso puede tardar 5-10 minutos. Docker descargará e instalará todo.**

---

## 🔍 PASO 10: Verificar Despliegue

```bash
# Ver estado de los contenedores
docker-compose -f docker-compose.prod.yml ps

# Debería mostrar algo como:
# spotlyvf_backend_prod    Up
# spotlyvf_db_prod         Up  
# spotlyvf_redis_prod      Up
# spotlyvf_nginx_prod      Up
```

```bash
# Probar que la aplicación responde
curl http://localhost:8000/health/

# Debería devolver algo como: {"status": "ok"}
```

```bash
# Ver logs si hay problemas
docker-compose -f docker-compose.prod.yml logs backend
```

---

## 🌐 PASO 11: Probar desde Internet

**Desde tu navegador web:**
```
http://TU_ELASTIC_IP:8000/
```

**Deberías ver tu aplicación Django funcionando!**

---

## 📋 CHECKLIST - Verifica que todo funcione:

```bash
# ✅ 1. Contenedores corriendo
docker ps

# ✅ 2. Backend respondiendo
curl http://localhost:8000/health/

# ✅ 3. Base de datos conectada
docker-compose -f docker-compose.prod.yml exec backend python manage.py showmigrations

# ✅ 4. Aplicación accesible desde internet
curl http://TU_ELASTIC_IP:8000/

# ✅ 5. Ver estadísticas del sistema
./monitor.sh
```

---

## 🆘 SI HAY PROBLEMAS:

### Problema 1: Error al conectar Docker
```bash
# Verificar que Docker esté corriendo
sudo systemctl status docker

# Si no está corriendo:
sudo systemctl start docker
```

### Problema 2: Contenedores no inician
```bash
# Ver logs detallados
docker-compose -f docker-compose.prod.yml logs

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Problema 3: No puedes acceder desde internet
```bash
# Verificar que Nginx esté corriendo
sudo systemctl status nginx

# Verificar puertos abiertos
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :80
```

---

## ✅ SIGUIENTE PASO

Una vez que todo esté funcionando, compárteme:

1. ✅ **Resultado de**: `docker ps`
2. ✅ **Resultado de**: `curl http://localhost:8000/health/`
3. ✅ **Si puedes acceder** desde tu navegador a `http://TU_ELASTIC_IP:8000/`

Entonces procederemos con:
- 🔐 **Configuración SSL** (si tienes dominio)
- 👤 **Crear superusuario** para admin
- 📊 **Configurar monitoreo**
- 🔄 **Backups automáticos**

**¡Dime cómo va todo! 🚀**
