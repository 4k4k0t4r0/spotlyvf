#!/bin/bash

# AWS EC2 Deployment Script for Spotlyvf
# Run this script on your EC2 instance after connecting via SSH

set -e  # Exit on any error

echo "🚀 Starting Spotlyvf deployment on AWS EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install additional tools
print_status "Installing additional tools..."
sudo apt install -y nginx certbot python3-certbot-nginx git htop curl wget unzip

# Create project directory
print_status "Setting up project directory..."
PROJECT_DIR="/home/ubuntu/spotlyvf"
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p $PROJECT_DIR/{backups,logs,certbot/{conf,www}}

# Set up environment file
print_status "Setting up environment configuration..."
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    print_warning "Please create .env.production file with your configuration"
    print_warning "Use .env.production.example as a template"
fi

# Create backup script
print_status "Creating backup script..."
cat > $PROJECT_DIR/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/spotlyvf/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker exec spotlyvf_db_prod mysqldump -u root -p$DB_ROOT_PASSWORD spotlyvf > $BACKUP_DIR/db_backup_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz -C /var/lib/docker/volumes/spotlyvf_media_files_prod/_data .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $PROJECT_DIR/backup.sh

# Create deployment script
print_status "Creating deployment script..."
cat > $PROJECT_DIR/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying Spotlyvf..."

# Pull latest changes (if using git)
# git pull origin main

# Build and start services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Show status
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed!"
EOF

chmod +x $PROJECT_DIR/deploy.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > $PROJECT_DIR/monitor.sh << 'EOF'
#!/bin/bash

echo "=== Spotlyvf System Status ==="
echo

echo "🐳 Docker Containers:"
docker-compose -f /home/ubuntu/spotlyvf/docker-compose.prod.yml ps

echo
echo "💾 Disk Usage:"
df -h

echo
echo "🧠 Memory Usage:"
free -h

echo
echo "📊 System Load:"
uptime

echo
echo "🔄 Recent Backend Logs:"
docker-compose -f /home/ubuntu/spotlyvf/docker-compose.prod.yml logs --tail=10 backend

echo
echo "📈 Docker Stats:"
docker stats --no-stream
EOF

chmod +x $PROJECT_DIR/monitor.sh

# Set up cron jobs
print_status "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/spotlyvf/backup.sh >> /home/ubuntu/spotlyvf/logs/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/bin/certbot renew --quiet") | crontab -

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/spotlyvf > /dev/null << EOF
/home/ubuntu/spotlyvf/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

print_status "✅ EC2 setup completed!"
print_warning "Next steps:"
echo "1. Upload your project files to $PROJECT_DIR"
echo "2. Create and configure .env.production file"
echo "3. Update nginx configuration with your domain"
echo "4. Run the deployment script: ./deploy.sh"
echo "5. Configure SSL with certbot"
echo ""
echo "Useful commands:"
echo "- Monitor system: ./monitor.sh"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Backup data: ./backup.sh"
echo "- Deploy updates: ./deploy.sh"
