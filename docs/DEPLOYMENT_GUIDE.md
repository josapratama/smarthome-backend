# Smart Home Backend Deployment Guide

## Overview

This guide covers deployment options for the Smart Home Backend, from development to production environments.

## Prerequisites

### System Requirements

- **Node.js**: 18+ or **Bun**: 1.0+
- **PostgreSQL**: 14+
- **Redis**: 6+ (optional, for caching)
- **MQTT Broker**: Mosquitto or similar
- **Memory**: 2GB+ RAM
- **Storage**: 10GB+ available space

### Environment Setup

```bash
# Install Bun (recommended)
curl -fsSL https://bun.sh/install | bash

# Or use Node.js
node --version  # Should be 18+
```

## Development Deployment

### 1. Local Development

```bash
# Clone repository
git clone <repository-url>
cd smarthome-backend

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
bun run prisma:migrate
bun run prisma:generate

# Start development server
bun run dev
```

### 2. Development with Docker

```bash
# Start all services
docker-compose up --build

# Or start in background
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Production Deployment

### Option 1: Docker Production

#### 1. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: smarthome_prod
      POSTGRES_USER: smarthome
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_logs:/mosquitto/log
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://smarthome:${DB_PASSWORD}@postgres:5432/smarthome_prod
      REDIS_URL: redis://redis:6379
      MQTT_BROKER_URL: mqtt://mosquitto:1883
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - mosquitto
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  mosquitto_data:
  mosquitto_logs:
```

#### 2. Production Dockerfile

```dockerfile
# Dockerfile.prod
FROM oven/bun:1-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run prisma:generate
RUN bun run tailwind:build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 smarthome

# Copy built application
COPY --from=deps --chown=smarthome:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=smarthome:nodejs /app/dist ./dist
COPY --from=builder --chown=smarthome:nodejs /app/public ./public
COPY --from=builder --chown=smarthome:nodejs /app/prisma ./prisma
COPY --from=builder --chown=smarthome:nodejs /app/package.json ./

# Create directories
RUN mkdir -p /app/uploads /app/logs
RUN chown -R smarthome:nodejs /app

USER smarthome

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "start"]
```

#### 3. Deploy Production

```bash
# Create production environment file
cp .env.example .env.prod

# Edit production configuration
nano .env.prod

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec api bun run prisma:migrate

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: VPS/Server Deployment

#### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl git nginx postgresql postgresql-contrib redis-server

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Node.js (alternative)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup PostgreSQL
sudo -u postgres createuser --interactive smarthome
sudo -u postgres createdb smarthome_prod
sudo -u postgres psql -c "ALTER USER smarthome PASSWORD 'your-secure-password';"

# Setup Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 2. Application Deployment

```bash
# Clone and setup application
cd /opt
sudo git clone <repository-url> smarthome-backend
sudo chown -R $USER:$USER smarthome-backend
cd smarthome-backend

# Install dependencies
bun install --production

# Setup environment
cp .env.example .env
nano .env  # Configure production settings

# Build application
bun run prisma:generate
bun run tailwind:build

# Run migrations
bun run prisma:migrate

# Create systemd service
sudo nano /etc/systemd/system/smarthome-backend.service
```

#### 3. Systemd Service Configuration

```ini
[Unit]
Description=Smart Home Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=smarthome
WorkingDirectory=/opt/smarthome-backend
Environment=NODE_ENV=production
ExecStart=/home/smarthome/.bun/bin/bun start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=smarthome-backend

[Install]
WantedBy=multi-user.target
```

```bash
# Create user and setup service
sudo useradd -r -s /bin/false smarthome
sudo chown -R smarthome:smarthome /opt/smarthome-backend

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable smarthome-backend
sudo systemctl start smarthome-backend

# Check status
sudo systemctl status smarthome-backend
```

#### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/smarthome-backend
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /opt/smarthome-backend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    client_max_body_size 50M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smarthome-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Cloud Deployment

#### AWS ECS Deployment

```yaml
# ecs-task-definition.json
{
  "family": "smarthome-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions":
    [
      {
        "name": "smarthome-backend",
        "image": "your-account.dkr.ecr.region.amazonaws.com/smarthome-backend:latest",
        "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
        "environment":
          [
            { "name": "NODE_ENV", "value": "production" },
            { "name": "PORT", "value": "3000" },
          ],
        "secrets":
          [
            {
              "name": "DATABASE_URL",
              "valueFrom": "arn:aws:secretsmanager:region:account:secret:smarthome/database-url",
            },
            {
              "name": "JWT_SECRET",
              "valueFrom": "arn:aws:secretsmanager:region:account:secret:smarthome/jwt-secret",
            },
          ],
        "logConfiguration":
          {
            "logDriver": "awslogs",
            "options":
              {
                "awslogs-group": "/ecs/smarthome-backend",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs",
              },
          },
        "healthCheck":
          {
            "command":
              ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
            "interval": 30,
            "timeout": 5,
            "retries": 3,
            "startPeriod": 60,
          },
      },
    ],
}
```

#### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smarthome-backend
  labels:
    app: smarthome-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smarthome-backend
  template:
    metadata:
      labels:
        app: smarthome-backend
    spec:
      containers:
        - name: smarthome-backend
          image: smarthome-backend:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: smarthome-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: smarthome-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: smarthome-backend-service
spec:
  selector:
    app: smarthome-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Environment Configuration

### Production Environment Variables

```bash
# .env.prod
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=20

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# MQTT
MQTT_BROKER_URL=mqtt://your-mqtt-broker:1883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File uploads
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/app/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Security
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# AI Processing
AI_PREDICTION_INTERVAL=30
AI_DAILY_PREDICTION_TIME=00:05
AI_ENABLE_AUTO_PROCESSING=true
```

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# PM2 ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smarthome-backend',
    script: 'bun',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Log Management

```bash
# Setup log rotation
sudo nano /etc/logrotate.d/smarthome-backend

# Log rotation configuration
/opt/smarthome-backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 smarthome smarthome
    postrotate
        systemctl reload smarthome-backend
    endscript
}
```

### 3. Health Monitoring

```bash
# Setup monitoring script
#!/bin/bash
# /opt/scripts/health-check.sh

HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Health check failed with status: $RESPONSE"
    systemctl restart smarthome-backend
    # Send alert notification
fi

# Add to crontab
# */5 * * * * /opt/scripts/health-check.sh
```

## Security Considerations

### 1. Firewall Configuration

```bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1883/tcp  # MQTT
sudo ufw enable
```

### 2. Database Security

```sql
-- Create restricted database user
CREATE USER smarthome_app WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE smarthome_prod TO smarthome_app;
GRANT USAGE ON SCHEMA public TO smarthome_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smarthome_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smarthome_app;
```

### 3. SSL/TLS Configuration

```bash
# Generate strong DH parameters
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Setup automatic certificate renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Backup & Recovery

### 1. Database Backup

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="smarthome_prod"

# Create backup
pg_dump -h localhost -U smarthome $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Add to crontab for daily backups
# 0 2 * * * /opt/scripts/backup-db.sh
```

### 2. Application Backup

```bash
#!/bin/bash
# /opt/scripts/backup-app.sh

BACKUP_DIR="/opt/backups"
APP_DIR="/opt/smarthome-backend"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup uploads and logs
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz -C $APP_DIR uploads logs

# Keep only last 7 days
find $BACKUP_DIR -name "app_data_*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Check connections
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   ```

2. **High Memory Usage**

   ```bash
   # Monitor memory usage
   htop

   # Check application memory
   ps aux | grep bun
   ```

3. **Performance Issues**
   ```bash
   # Check slow queries
   sudo -u postgres psql smarthome_prod -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

### Log Analysis

```bash
# View application logs
sudo journalctl -u smarthome-backend -f

# Check error logs
tail -f /opt/smarthome-backend/logs/err.log

# Analyze access patterns
tail -f /var/log/nginx/access.log | grep "POST\|PUT\|DELETE"
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM sensor_data WHERE device_id = 1 ORDER BY timestamp DESC LIMIT 100;

-- Update statistics
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;
```

### 2. Application Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup**
2. **Database Read Replicas**
3. **Redis Clustering**
4. **CDN for Static Assets**

### Vertical Scaling

1. **Increase server resources**
2. **Optimize database configuration**
3. **Tune application parameters**

---

This deployment guide provides comprehensive instructions for deploying the Smart Home Backend in various environments. Choose the deployment method that best fits your infrastructure and requirements.
