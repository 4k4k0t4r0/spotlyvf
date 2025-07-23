#!/bin/bash

# Spotlyvf - Script de Deployment Automático para EC2
# Este script descarga el proyecto desde GitHub y lo configura para producción

set -e  # Salir si cualquier comando falla

echo "=== SPOTLYVF DEPLOYMENT SCRIPT ==="
echo "Iniciando deployment automático..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloridos
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos ejecutando como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse como root (sudo)"
   exit 1
fi

print_message "1. Actualizando sistema..."
apt update && apt upgrade -y

print_message "2. Instalando dependencias básicas..."
apt install -y git curl wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_message "3. Instalando Docker..."
# Remover versiones anteriores
apt remove -y docker docker-engine docker.io containerd runc || true

# Agregar repositorio oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

print_message "4. Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

print_message "5. Configurando usuario para Docker..."
usermod -aG docker ubuntu || true
usermod -aG docker $(logname) || true

print_message "6. Clonando proyecto desde GitHub..."
cd /home/ubuntu
if [ -d "spotlyvf" ]; then
    print_warning "Directorio spotlyvf ya existe. Eliminando..."
    rm -rf spotlyvf
fi

git clone https://github.com/4k4k0t4r0/spotlyvf.git
chown -R ubuntu:ubuntu spotlyvf
cd spotlyvf

print_message "7. Configurando variables de entorno..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_warning "Archivo .env creado desde .env.example"
    print_warning "IMPORTANTE: Edita backend/.env con tus configuraciones reales"
fi

if [ ! -f .env.production ]; then
    cp .env.production.example .env.production
    print_warning "Archivo .env.production creado desde ejemplo"
    print_warning "IMPORTANTE: Edita .env.production con tus configuraciones reales"
fi

print_message "8. Descargando modelos de IA (opcional)..."
# Crear script para descargar modelos de IA posteriormente
cat > download_ai_models.sh << 'EOF'
#!/bin/bash
echo "Descargando modelos de IA..."
mkdir -p backend/ai_models/modelo_bert_sentimiento
cd backend/ai_models/modelo_bert_sentimiento

# Estos archivos grandes se deben descargar por separado
echo "Para completar la funcionalidad de IA, descarga manualmente:"
echo "1. GloVe embeddings: https://nlp.stanford.edu/projects/glove/"
echo "2. Modelo BERT entrenado desde tu backup"
echo "3. Coloca los archivos en backend/ai_models/"
EOF

chmod +x download_ai_models.sh
print_warning "Ejecuta './download_ai_models.sh' después para configurar los modelos de IA"

print_message "9. Construyendo contenedores Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_message "10. Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable

print_message "11. Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

print_message "12. Esperando que los servicios estén listos..."
sleep 30

print_message "13. Verificando estado de los servicios..."
docker-compose -f docker-compose.prod.yml ps

print_message "14. Configurando SSL (opcional)..."
if [ -f setup_ssl.sh ]; then
    chmod +x setup_ssl.sh
    print_warning "Para configurar SSL, ejecuta: ./setup_ssl.sh tu-dominio.com"
fi

print_message "15. Configuración de monitoreo..."
# Crear script básico de monitoreo
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== Estado de Spotlyvf ==="
echo "Contenedores:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "Uso de recursos:"
docker stats --no-stream
echo ""
echo "Logs recientes del backend:"
docker-compose -f docker-compose.prod.yml logs --tail=10 backend
EOF

chmod +x monitor.sh

print_message "16. Creando script de backup..."
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creando backup de la base de datos..."
docker-compose -f docker-compose.prod.yml exec -T db mysqldump -u spotlyvf -p spotlyvf > $BACKUP_DIR/db_backup_$DATE.sql

echo "Backup completado: $BACKUP_DIR/db_backup_$DATE.sql"
EOF

chmod +x backup.sh

print_message "17. Configurando logs..."
mkdir -p /var/log/spotlyvf
chown ubuntu:ubuntu /var/log/spotlyvf

echo ""
print_message "=== DEPLOYMENT COMPLETADO ==="
echo ""
print_message "URLs de acceso:"
echo "  - Backend API: http://$(curl -s ifconfig.me):8000"
echo "  - Documentación API: http://$(curl -s ifconfig.me):8000/admin"
echo ""
print_message "Archivos importantes:"
echo "  - Configuración: backend/.env y .env.production"
echo "  - Monitoreo: ./monitor.sh"
echo "  - Backup: ./backup.sh"
echo "  - SSL: ./setup_ssl.sh tu-dominio.com"
echo "  - Modelos IA: ./download_ai_models.sh"
echo ""
print_warning "SIGUIENTE PASOS:"
echo "1. Edita backend/.env con tus configuraciones de base de datos"
echo "2. Edita .env.production con tu dominio y configuraciones"
echo "3. Ejecuta ./setup_ssl.sh tu-dominio.com para HTTPS"
echo "4. Ejecuta ./download_ai_models.sh para modelos de IA"
echo "5. Usa ./monitor.sh para ver el estado del sistema"
echo ""
print_message "¡Spotlyvf está ejecutándose en tu servidor EC2!"
