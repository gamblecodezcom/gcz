#!/bin/bash
# Production deployment script for GambleCodez

set -e

echo "=== GambleCodez Production Deployment ==="

# Check environment
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is required"
    exit 1
fi

# Run database migrations
echo "Running database migrations..."
for migration in sql/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "Applying migration: $migration"
        psql "$DATABASE_URL" -f "$migration" || echo "Warning: Migration may have already been applied"
    fi
done

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
npm ci

# Create logs directory
mkdir -p logs

# Start services with PM2
echo "Starting services with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Setup Nginx (if not already configured)
if [ ! -f "/etc/nginx/sites-available/gamblecodez" ]; then
    echo "Setting up Nginx configuration..."
    sudo tee /etc/nginx/sites-available/gamblecodez > /dev/null <<EOF
server {
    listen 80;
    server_name gamblecodez.com www.gamblecodez.com;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gamblecodez.com www.gamblecodez.com;

    ssl_certificate /etc/letsencrypt/live/gamblecodez.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamblecodez.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    root /var/www/html/gcz/frontend/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

    sudo ln -sf /etc/nginx/sites-available/gamblecodez /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

# Setup SSL with Let's Encrypt (if not already done)
if [ ! -d "/etc/letsencrypt/live/gamblecodez.com" ]; then
    echo "Setting up SSL certificate..."
    sudo certbot --nginx -d gamblecodez.com -d www.gamblecodez.com --non-interactive --agree-tos --email admin@gamblecodez.com
fi

# Setup health check endpoint
echo "Health check endpoint available at: https://gamblecodez.com/api/health"

# Final status
echo ""
echo "=== Deployment Complete ==="
echo "Services status:"
pm2 status

echo ""
echo "Next steps:"
echo "1. Verify environment variables in .env file"
echo "2. Check logs: pm2 logs"
echo "3. Monitor health: curl https://gamblecodez.com/api/health"
