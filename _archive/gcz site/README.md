# GambleCodez Complete Site Package

## 🎰 Casino Affiliate Platform

This is the complete GambleCodez casino affiliate platform with:
- ✅ Full PHP website with dynamic affiliate listings
- ✅ Complete admin dashboard with all functionality
- ✅ Affiliate management system
- ✅ Contact forms and vault system
- ✅ Postback handlers for Gemified API
- ✅ PWA support
- ✅ Dark neon theme
- ✅ Mobile responsive design

## 📁 Directory Structure

```
gamblecodz-complete/
├── index.php              # Main homepage
├── blacklist.php          # Public blacklist page
├── newsletter-signup.php  # Newsletter handler
├── manifest.json          # PWA manifest
├── sw.js                 # Service worker
├── deploy.sh             # Deployment script
├── admin/                # Admin panel
│   ├── admin-dashboard.php
│   ├── affiliates.php
│   ├── vault.php
│   ├── contact.php
│   ├── broadcasts.php
│   └── reports.php
├── css/                  # Stylesheets
│   └── neon-dark.css
├── js/                   # JavaScript files
│   ├── gc-menu-system.js
│   └── gc-affiliates.js
├── data/                 # Data files (JSON)
│   ├── affiliates.json
│   ├── contact.json
│   └── [other data files]
├── ads/                  # Ad configurations
│   └── ad-space.json
└── postback/             # Gemified API handlers
    ├── registrations.php
    ├── deposits.php
    └── sales.php
```

## 🚀 Deployment Instructions

1. **Upload Files**: Upload entire `gamblecodz-complete/` directory to your server

2. **Run Deployment Script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure Environment**:
   - Edit `admin/.env.php` to set your admin credentials
   - Update Gemified API credentials if needed
   - Configure your domain in nginx config

4. **Access Points**:
   - **Main Site**: `https://yourdomain.com`
   - **Admin Panel**: `https://admin.yourdomain.com/admin-dashboard.php?uid=ADMIN_12345`
   - **Postback URLs**: `https://yourdomain.com/postback/[registrations|deposits|sales].php`

## 🔧 Admin Features

### Affiliate Management
- Add/edit/delete affiliates
- Search and pagination
- Auto-timestamping
- CSV export/import
- Level-based filtering

### Vault System
- Secure credential storage
- Tag-based organization
- Search functionality

### Contact Management
- View form submissions
- Email integration ready
- IP tracking

### Broadcast System
- Send notifications
- History tracking
- Multiple target types

### Blacklist Management
- View blacklisted sites
- Public blacklist page
- Status management

## 🎨 Features

- **Neon Dark Theme**: Cyberpunk-inspired design
- **Mobile Responsive**: Works on all devices
- **PWA Ready**: Installable web app
- **SEO Optimized**: Meta tags and structure
- **Fast Loading**: Optimized assets
- **Security**: Admin authentication
- **API Integration**: Gemified postback handlers

## 📊 Data Management

All data is stored in JSON files in the `data/` directory:
- `affiliates.json` - Main affiliate database
- `contact.json` - Contact form submissions
- `vault.json` - Secure credentials
- `broadcasts.json` - Broadcast history
- `conversions.json` - API conversion data

## 🔒 Security

- Admin panel protected by UID authentication
- Input validation on all forms
- XSS protection
- CSRF protection ready
- File permission management

## 🌐 Nginx Configuration

The site expects these domains:
- Main site: `gamblecodz.com`
- Admin panel: `admin.gamblecodz.com`

Configure SSL certificates and PHP-FPM as needed.

## 📱 PWA Features

- Offline support
- Install prompt
- Service worker caching
- App-like experience

## 🚨 Important Notes

1. **Backup First**: Always backup existing data before deployment
2. **Permissions**: Ensure proper file permissions (www-data ownership)
3. **PHP Version**: Requires PHP 8.2 or higher
4. **Extensions**: Requires JSON, CURL, and standard PHP extensions
5. **Security**: Change default admin credentials immediately

## 🔧 Customization

- Update `admin/.env.php` for admin settings
- Modify `css/neon-dark.css` for styling changes
- Edit `data/affiliates.json` to add your affiliate data
- Configure `ads/ad-space.json` for overlay ads

## 📞 Support

This is a complete, production-ready casino affiliate platform. All functionality is fully implemented and tested.

Admin Login: `admin-dashboard.php?uid=ADMIN_12345`
(Change the UID in `.env.php` for security)
