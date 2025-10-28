# HopeNest NGO Platform - Production Deployment Guide

## Overview

HopeNest is a comprehensive NGO platform built with React (frontend) and Node.js/Express (backend), featuring donation management, crowdfunding campaigns, volunteer registration, and admin dashboard functionality.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Frontend    │    │     Backend     │    │    Database     │
│   (React/Vite)  │◄──►│ (Node.js/Express)│◄──►│    (MongoDB)    │
│     Port 80     │    │    Port 5000    │    │   Port 27017    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Production Requirements

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended), Windows Server 2019+, or macOS
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended

### Software Dependencies
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (if running without Docker)
- **MongoDB**: Version 7.0+ (if running without Docker)

## Quick Start with Docker (Recommended)

### 1. Clone and Configure
```bash
git clone <your-repository-url>
cd NgoCode
cp .env.docker .env
```

### 2. Update Environment Variables
Edit the `.env` file with your production values:
```bash
# Critical: Change these values!
MONGO_ROOT_PASSWORD=your_secure_root_password
MONGO_USER_PASSWORD=your_secure_user_password
JWT_SECRET=your_very_secure_jwt_secret_at_least_32_characters
SESSION_SECRET=your_secure_session_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Domain Configuration
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
VITE_API_HOST=https://api.yourdomain.com
```

### 3. Deploy
```bash
# Make deployment script executable (Linux/macOS)
chmod +x deploy.sh

# Deploy the application
./deploy.sh deploy

# Or on Windows
deploy.bat
```

### 4. Verify Deployment
- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Manual Installation (Without Docker)

### Prerequisites
```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install --production

# Create environment file
cp .env.production .env

# Edit environment variables
nano .env

# Start the application
npm start
```

### Frontend Setup
```bash
cd HopeNest

# Install dependencies
npm install

# Create environment file
cp .env.production .env

# Build for production
npm run build:production

# Serve with nginx or your preferred web server
```

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (production/staging/development) | Yes | development |
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret (32+ characters) | Yes | - |
| `SMTP_HOST` | Email server host | Yes | - |
| `SMTP_PORT` | Email server port | Yes | 587 |
| `SMTP_USER` | Email username | Yes | - |
| `SMTP_PASS` | Email password/app password | Yes | - |
| `FRONTEND_URL` | Frontend application URL | Yes | - |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | Yes | - |
| `ENABLE_HELMET` | Enable security headers | No | true |
| `ENABLE_RATE_LIMITING` | Enable API rate limiting | No | true |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | No | error |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | - |
| `VITE_API_HOST` | Backend host URL | Yes | - |
| `VITE_APP_NAME` | Application name | No | HopeNest |
| `VITE_ENVIRONMENT` | Environment name | No | production |

## Security Configuration

### SSL/TLS Setup
For production, always use HTTPS:

1. **Let's Encrypt (Free)**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

2. **Commercial Certificate**:
   - Purchase from a trusted CA
   - Configure in nginx/Apache

### Security Headers
The application includes built-in security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### Rate Limiting
API endpoints are protected with rate limiting:
- Auth endpoints: 10 requests per 15 minutes
- File uploads: 20 requests per hour
- General API: 100 requests per 15 minutes

## Database Management

### Backup Strategy
```bash
# Manual backup
docker exec hopenest-mongo mongodump --out /tmp/backup
docker cp hopenest-mongo:/tmp/backup ./mongodb_backup

# Automated backup (add to cron)
0 2 * * * /path/to/backup-script.sh
```

### Restore Database
```bash
# Restore from backup
docker cp ./mongodb_backup hopenest-mongo:/tmp/restore
docker exec hopenest-mongo mongorestore /tmp/restore
```

### Database Indexes
The application automatically creates these indexes:
- Users: email (unique)
- Campaigns: status, createdAt
- Donations: userId, campaignId
- Volunteers: userId

## Monitoring and Logging

### Application Logs
Logs are stored in:
- Docker: `/app/logs/` (mounted volume)
- Manual: `./logs/` directory

### Health Checks
- **Backend**: `GET /health`
- **API Status**: `GET /api/status`
- **Database**: Included in health check

### Monitoring Endpoints
```bash
# Check application health
curl http://localhost:5000/health

# Check API status
curl http://localhost:5000/api/status

# View service status
docker-compose ps
```

## Scaling and Performance

### Database Optimization
1. **Indexes**: Ensure proper indexing for queries
2. **Connection Pooling**: MongoDB handles this automatically
3. **Replica Sets**: For high availability (production)

### Application Scaling
1. **Horizontal Scaling**: Run multiple backend instances
2. **Load Balancing**: Use nginx or cloud load balancers
3. **CDN**: Serve static assets from CDN

### Docker Scaling
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use load balancer for multiple instances
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   docker logs hopenest-mongo
   
   # Verify connection string
   echo $MONGODB_URI
   ```

2. **CORS Errors**
   ```bash
   # Verify ALLOWED_ORIGINS includes your domain
   # Check frontend URL configuration
   ```

3. **Email Not Sending**
   ```bash
   # Test SMTP settings
   # Check application logs for email errors
   docker logs hopenest-backend
   ```

4. **High Memory Usage**
   ```bash
   # Monitor container resources
   docker stats
   
   # Check for memory leaks in logs
   docker logs hopenest-backend | grep -i memory
   ```

### Log Analysis
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Search for errors
docker-compose logs | grep -i error
```

## Maintenance

### Regular Updates
1. **Security Updates**: Update base images monthly
2. **Dependency Updates**: Update npm packages quarterly
3. **Database Maintenance**: Regular backup verification

### Update Process
```bash
# 1. Backup current deployment
./deploy.sh backup

# 2. Pull latest changes
git pull origin main

# 3. Update and deploy
./deploy.sh deploy

# 4. Verify deployment
curl http://localhost:5000/health
```

### Backup Schedule
- **Daily**: Database backup
- **Weekly**: Full application backup
- **Monthly**: Test restore procedure

## Support and Contacts

For deployment issues or questions:
1. Check logs: `docker-compose logs`
2. Review this documentation
3. Contact the development team

## Appendix

### Useful Commands
```bash
# View service status
docker-compose ps

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update and redeploy
./deploy.sh deploy

# Emergency stop
docker-compose down

# Clean up old images
docker system prune -a
```

### Directory Structure
```
NgoCode/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── uploads/            # File uploads
│   ├── logs/               # Application logs
│   └── server.js           # Main server file
├── HopeNest/               # React frontend
│   ├── src/                # Source code
│   ├── dist/               # Built files
│   └── nginx.conf          # Nginx configuration
├── .env                    # Environment variables
├── docker-compose.yml      # Docker composition
├── deploy.sh               # Deployment script
└── README.md               # This file
```