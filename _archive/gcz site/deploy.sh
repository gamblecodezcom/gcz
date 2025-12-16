#!/bin/bash
# GambleCodez Deployment Script
# Run this script to deploy the site to production

echo "🚀 Starting GambleCodez deployment..."

# Set variables
SITE_DIR="/var/www/html"
ADMIN_DIR="/var/www/admin"
ADS_DIR="/var/www/ads"
POSTBACK_DIR="/var/www/postback"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/gcz-backup-$TIMESTAMP.tar.gz $SITE_DIR $ADMIN_DIR $ADS_DIR $POSTBACK_DIR 2>/dev/null || true

# Create directories
echo "📁 Creating directories..."
mkdir -p $SITE_DIR $ADMIN_DIR $ADS_DIR $POSTBACK_DIR
mkdir -p $ADMIN_DIR/data

# Copy files
echo "📋 Copying site files..."
cp -r * $SITE_DIR/
mv $SITE_DIR/admin/* $ADMIN_DIR/
mv $SITE_DIR/ads/* $ADS_DIR/
mv $SITE_DIR/postback/* $POSTBACK_DIR/

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data $SITE_DIR $ADMIN_DIR $ADS_DIR $POSTBACK_DIR
find $SITE_DIR $ADMIN_DIR $ADS_DIR $POSTBACK_DIR -type d -exec chmod 755 {} \;
find $SITE_DIR $ADMIN_DIR $ADS_DIR $POSTBACK_DIR -type f -exec chmod 644 {} \;
chmod +x $POSTBACK_DIR/*.php

# Restart services
echo "🔄 Restarting services..."
systemctl reload php8.2-fpm
systemctl reload nginx

echo "✅ Deployment complete!"
echo "📍 Site: https://gamblecodez.com"
echo "🔧 Admin: https://admin.gamblecodz.com/admin-dashboard.php?uid=ADMIN_12345"
echo "📊 Postbacks: https://gamblecodz.com/postback/"
