# SSL Certificate Setup Script for Spotlyvf
# Run this after your domain is pointing to your EC2 instance

#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
read -p "Enter your domain name (e.g., spotlyvf.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificate: " ADMIN_EMAIL

if [ -z "$DOMAIN_NAME" ] || [ -z "$ADMIN_EMAIL" ]; then
    print_error "Domain name and email are required"
    exit 1
fi

print_status "Setting up SSL certificate for $DOMAIN_NAME"

# Update Nginx configuration with actual domain
print_status "Updating Nginx configuration..."
sed -i "s/your-domain.com/$DOMAIN_NAME/g" /home/ubuntu/spotlyvf/nginx/default.conf

# Create initial Nginx config without SSL
print_status "Creating initial Nginx configuration..."
cat > /etc/nginx/sites-available/spotlyvf << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME api.$DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/spotlyvf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate
print_status "Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN_NAME -d api.$DOMAIN_NAME --email $ADMIN_EMAIL --agree-tos --non-interactive

# Update environment file
print_status "Updating environment configuration..."
if [ -f "/home/ubuntu/spotlyvf/.env.production" ]; then
    sed -i "s/DOMAIN_NAME=.*/DOMAIN_NAME=$DOMAIN_NAME/" /home/ubuntu/spotlyvf/.env.production
    sed -i "s/ADMIN_EMAIL=.*/ADMIN_EMAIL=$ADMIN_EMAIL/" /home/ubuntu/spotlyvf/.env.production
    sed -i "s/your-domain.com/$DOMAIN_NAME/g" /home/ubuntu/spotlyvf/.env.production
else
    print_warning "Environment file not found. Please create .env.production"
fi

# Set up auto-renewal
print_status "Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

print_status "✅ SSL certificate setup completed!"
print_status "Your site should now be accessible at:"
print_status "- https://$DOMAIN_NAME"
print_status "- https://api.$DOMAIN_NAME"

print_warning "Next steps:"
echo "1. Test your SSL certificate: https://www.ssllabs.com/ssltest/"
echo "2. Update your frontend configuration to use HTTPS"
echo "3. Update CORS settings in Django to allow your domain"
