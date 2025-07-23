#!/bin/bash

# Script de Troubleshooting para Spotlyvf
echo "=== SPOTLYVF TROUBLESHOOTING ==="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "1. Verificando estado del sistema..."

# Verificar Docker
if command -v docker &> /dev/null; then
    print_status "Docker está instalado"
    if systemctl is-active --quiet docker; then
        print_status "Docker está ejecutándose"
    else
        print_error "Docker no está ejecutándose"
        echo "   Ejecuta: sudo systemctl start docker"
    fi
else
    print_error "Docker no está instalado"
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    print_status "Docker Compose está instalado"
else
    print_error "Docker Compose no está instalado"
fi

echo ""
echo "2. Verificando contenedores..."

if [ -f docker-compose.prod.yml ]; then
    echo "Estado de contenedores:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "Logs recientes del backend:"
    docker-compose -f docker-compose.prod.yml logs --tail=20 backend
    
    echo ""
    echo "Logs recientes de la base de datos:"
    docker-compose -f docker-compose.prod.yml logs --tail=10 db
else
    print_error "No se encuentra docker-compose.prod.yml"
fi

echo ""
echo "3. Verificando puertos..."
netstat -tlnp | grep :8000 && print_status "Puerto 8000 está en uso" || print_warning "Puerto 8000 no está en uso"
netstat -tlnp | grep :80 && print_status "Puerto 80 está en uso" || print_warning "Puerto 80 no está en uso"
netstat -tlnp | grep :3306 && print_status "Puerto 3306 (MySQL) está en uso" || print_warning "Puerto 3306 no está en uso"

echo ""
echo "4. Verificando archivos de configuración..."
[ -f backend/.env ] && print_status "backend/.env existe" || print_error "backend/.env no existe"
[ -f .env.production ] && print_status ".env.production existe" || print_error ".env.production no existe"

echo ""
echo "5. Verificando conectividad..."
if curl -f http://localhost:8000/health/ &> /dev/null; then
    print_status "Backend está respondiendo en localhost:8000"
else
    print_warning "Backend no está respondiendo en localhost:8000"
fi

echo ""
echo "6. Uso de recursos:"
docker stats --no-stream 2>/dev/null || echo "No hay contenedores ejecutándose"

echo ""
echo "=== COMANDOS ÚTILES ==="
echo "Reiniciar servicios:     docker-compose -f docker-compose.prod.yml restart"
echo "Ver logs en tiempo real: docker-compose -f docker-compose.prod.yml logs -f backend"
echo "Entrar al contenedor:    docker-compose -f docker-compose.prod.yml exec backend bash"
echo "Rebuild backend:         docker-compose -f docker-compose.prod.yml build --no-cache backend"
echo "Parar todo:              docker-compose -f docker-compose.prod.yml down"
echo "Iniciar todo:            docker-compose -f docker-compose.prod.yml up -d"
