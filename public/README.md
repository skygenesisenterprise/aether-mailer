# Security Headers and Browser Configuration

# These files provide additional security and browser configuration

## Files Overview:

### 📄 **Core Files**

- **robots.txt** - Search engine crawling instructions
- **manifest.json** - PWA manifest for mobile installation
- **sitemap.xml** - XML sitemap for SEO
- **speed-vitals.json** - Performance monitoring configuration

### 🔒 **Security Files (.well-known/)**

- **security.txt** - Security policy and contact information
- **browserconfig.xml** - Legacy browser compatibility settings

### 🎨 **Assets**

- **icons/** - PWA app icons (multiple sizes)
- **screenshots/** - PWA app screenshots

## Configuration Notes:

- Update domain URLs in manifest.json, sitemap.xml, and security.txt
- Replace placeholder icons in icons/ directory
- Add actual screenshots in screenshots/ directory
- Configure speed-vitals.json for your performance budget
- Adjust security.txt contact information

## Security Features:

- CSP headers handled by Next.js middleware
- Robot blocking for sensitive endpoints
- Security disclosure channels configured
- Performance budgets defined

## PWA Features:

- Installable web app
- App shortcuts for dashboard and login
- Offline capability (planned)
- Responsive design support
